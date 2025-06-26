'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, HelpCircle, SkipForward, X } from 'lucide-react';
import type { OnboardingItem } from '@/models/schemas';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type OnboardingItemCardProps = {
  item: OnboardingItem;
  onStatusChange: (itemId: string, status: 'completed' | 'skipped') => void;
  onGetTip: (item: OnboardingItem) => void;
};

const statusConfig = {
  'in-progress': {
    icon: Clock,
    className: 'bg-accent text-accent-foreground hover:bg-accent/80',
    text: 'In Progress',
  },
  completed: {
    icon: Check,
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    text: 'Completed',
  },
  skipped: {
    icon: X,
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
    text: 'Skipped',
  },
};

export function OnboardingItemCard({
  item,
  onStatusChange,
  onGetTip,
}: OnboardingItemCardProps) {
  const currentStatus = statusConfig[item.status];
  const isDone = item.status === 'completed' || item.status === 'skipped';

  return (
    <TooltipProvider>
      <Card className="w-full transition-all hover:shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium pr-4">{item.description}</CardTitle>
          <Badge className={cn('border-transparent whitespace-nowrap', currentStatus.className)}>
            <currentStatus.icon className="mr-1.5 h-4 w-4" />
            {currentStatus.text}
          </Badge>
        </CardHeader>
        <CardContent className="pt-2">
          {!isDone && (
            <div className="flex justify-end space-x-2 mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onGetTip(item)}>
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Get a Tip</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get an AI Tip</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStatusChange(item.id, 'skipped')}>
                    <SkipForward className="h-4 w-4" />
                    <span className="sr-only">Skip Task</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip Task</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onStatusChange(item.id, 'completed')}>
                    <Check className="h-5 w-5" />
                    <span className="sr-only">Mark Complete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as Complete</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
