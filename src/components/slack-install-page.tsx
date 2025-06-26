
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slack, CheckCircle, XCircle } from 'lucide-react';

function InstallStatus() {
  const searchParams = useSearchParams();
  const installStatus = searchParams.get('install');
  const error = searchParams.get('error');

  if (!installStatus) {
    return null;
  }

  if (installStatus === 'success') {
    return (
      <div className="mt-4 w-full p-4 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <h3 className="font-bold">Installation Successful!</h3>
          <p className="text-sm">
            You can now use OnboardBot in your Slack workspace.
          </p>
        </div>
      </div>
    );
  }

  if (installStatus === 'failure') {
    return (
      <div className="mt-4 w-full p-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-3">
        <XCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <h3 className="font-bold">Installation Failed</h3>
          <p className="text-sm">
            Error: {error || 'An unknown error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function SlackInstallPage() {
  const [addToSlackUrl, setAddToSlackUrl] = useState('');

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const scopes = process.env.NEXT_PUBLIC_SLACK_SCOPES;
    const redirectUri = `${window.location.origin}/api/slack/oauth`;

    if (clientId && scopes) {
      const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;
      setAddToSlackUrl(url);
    }
  }, []);

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
            <Slack className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Add OnboardBot to Slack</CardTitle>
        <CardDescription>
          Enable intelligent onboarding right within your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        {addToSlackUrl ? (
          <a href={addToSlackUrl}>
            <img
              alt="Add to Slack"
              height="40"
              width="139"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
            />
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-[40px] w-[139px] bg-muted animate-pulse rounded-md" />
             <p className="text-xs text-destructive">
                Slack integration not configured.
            </p>
          </div>
        )}
        <InstallStatus />
      </CardContent>
       <CardFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
                Need help? <a href="#" className="underline">Contact support</a>.
            </p>
        </CardFooter>
    </Card>
  );
}
