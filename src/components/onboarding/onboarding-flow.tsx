'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { identifyEmploymentType } from '@/ai/flows/identify-employment-type';
import { loadContextAndRespond } from '@/ai/flows/context-tool';
import { aiCoach } from '@/ai/flows/ai-coach';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  collection,
  query,
  where,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { OnboardingItemCard } from './onboarding-item-card';
import type { OnboardingItem, UserData } from '@/models/schemas';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Sparkles } from 'lucide-react';

type OnboardingStep =
  | 'initial'
  | 'identifying'
  | 'ineligible'
  | 'generating_tasks'
  | 'onboarding'
  | 'completed';

const CONTEXT_URLS = [
    'https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/Onboarding%20Macbook%20Quickstart%20Guide%2020d0af3751308095ae6aeb2ba11033ab.md?ref_type=heads',
    'https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/README.md?ref_type=heads'
];

export function OnboardingFlow() {
  const [step, setStep] = React.useState<OnboardingStep>('initial');
  const [userInput, setUserInput] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Record<string, string[]>>({});
  const [feedbackText, setFeedbackText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const { toast } = useToast();
  const { user } = useUser();
  const { auth, firestore } = useFirebase();

  const handleStart = React.useCallback(() => {
    setIsLoading(true);
    initiateAnonymousSignIn(auth);
    setStep('identifying');
    setIsLoading(false);
  }, [auth]);

  const handleIdentifyEmployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const { eligibleForOnboarding } = await identifyEmploymentType({ userResponse: userInput });
      
      const userRef = doc(firestore, 'users', user.uid);
      const userData: UserData = { slackUserId: user.uid, employmentType: userInput };
      setDocumentNonBlocking(userRef, userData, { merge: true });

      if (eligibleForOnboarding) {
        setStep('generating_tasks');
      } else {
        setStep('ineligible');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not identify employment type.' });
    } finally {
      setUserInput('');
      setIsLoading(false);
    }
  };
  
  React.useEffect(() => {
    if (step !== 'generating_tasks' || !user) return;

    const generateTasks = async () => {
        setIsLoading(true);
        try {
            const query = "From the provided context, extract a list of key onboarding tasks for a new hire. Return the result as a JSON array of strings. For example: [\"Task 1\", \"Task 2\"]";
            const { response } = await loadContextAndRespond({ urls: CONTEXT_URLS, query });
            
            const tasks = JSON.parse(response);
            if (Array.isArray(tasks)) {
                const onboardingCollection = collection(firestore, 'onboardingItems');
                tasks.forEach(taskDesc => {
                    addDocumentNonBlocking(onboardingCollection, {
                        userId: user.uid,
                        description: taskDesc,
                        status: 'in-progress',
                    });
                });
                setStep('onboarding');
            }
        } catch (error) {
            console.error('Error generating tasks:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate onboarding tasks.' });
            setStep('initial'); // Reset flow on error
        } finally {
            setIsLoading(false);
        }
    };
    generateTasks();
  }, [step, user, firestore, toast]);

  const onboardingItemsQuery = React.useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'onboardingItems'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: onboardingItems, isLoading: isLoadingItems } = useCollection<OnboardingItem>(onboardingItemsQuery);

  const handleStatusChange = (itemId: string, status: 'completed' | 'skipped') => {
    if (!firestore) return;
    const itemRef = doc(firestore, 'onboardingItems', itemId);
    updateDocumentNonBlocking(itemRef, { status });
  };

  const handleGetTip = async (item: OnboardingItem) => {
    setIsLoading(true);
    try {
        const itemSuggestions = suggestions[item.id] || [];
        const { suggestion } = await aiCoach({
            onboardingItem: item.description,
            previousSuggestions: itemSuggestions,
            context: 'Context from the onboarding documents.', // A more elaborate context can be passed here
        });

        setSuggestions(prev => ({
            ...prev,
            [item.id]: [...itemSuggestions, suggestion]
        }));
        
        toast({
            title: 'AI Coach Tip',
            description: suggestion,
        });
    } catch (error) {
        console.error('Error getting tip:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not get a tip from the AI coach.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !user || !firestore) return;
    
    const feedbackCollection = collection(firestore, 'feedback');
    addDocumentNonBlocking(feedbackCollection, {
        userId: user.uid,
        text: feedbackText,
        timestamp: serverTimestamp(),
        onboardingItemId: null
    });
    setFeedbackText('');
    toast({ title: 'Success', description: 'Thank you for your feedback!' });
  };

  const progress = React.useMemo(() => {
    if (!onboardingItems || onboardingItems.length === 0) return 0;
    const completedCount = onboardingItems.filter(item => item.status === 'completed' || item.status === 'skipped').length;
    return (completedCount / onboardingItems.length) * 100;
  }, [onboardingItems]);

  React.useEffect(() => {
    if (step === 'onboarding' && progress === 100 && onboardingItems && onboardingItems.length > 0) {
      setStep('completed');
    }
  }, [progress, step, onboardingItems]);

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">Ready to start your onboarding journey?</p>
            <Button onClick={handleStart} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Let's Go!
            </Button>
          </div>
        );
      case 'identifying':
        return (
          <form onSubmit={handleIdentifyEmployment} className="w-full space-y-4">
            <p className="text-muted-foreground">First, what is your employment type? (e.g., Full-time, Contractor)</p>
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !userInput.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          </form>
        );
      case 'ineligible':
        return <p className="text-center text-muted-foreground">Thank you. Based on your employment type, you are not eligible for this onboarding process.</p>;
      case 'generating_tasks':
        return <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p>Analyzing documents and preparing your onboarding plan...</p></div>;
      case 'onboarding':
        return (
          <div className="w-full space-y-4">
            <Progress value={progress} className="w-full" />
            {isLoadingItems ? (
              <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto p-1">
                {onboardingItems?.map(item => (
                  <OnboardingItemCard key={item.id} item={item} onStatusChange={handleStatusChange} onGetTip={handleGetTip} />
                ))}
              </div>
            )}
          </div>
        );
      case 'completed':
        return (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">🎉 Onboarding Complete! 🎉</h3>
            <p>Congratulations and welcome to the team! If you have any feedback, please share it below.</p>
            <form onSubmit={handleFeedbackSubmit} className="w-full space-y-2">
              <Textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Your feedback..." />
              <Button type="submit" disabled={!feedbackText.trim()}>Submit Feedback</Button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Bot className="h-8 w-8 text-primary" />
          OnboardBot
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[200px] flex items-center justify-center">
        {renderContent()}
      </CardContent>
      <CardFooter>
          <p className="text-xs text-muted-foreground w-full text-center">Your friendly onboarding assistant.</p>
      </CardFooter>
    </Card>
  );
}
