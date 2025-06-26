import { SlackInstallPage } from '@/components/slack-install-page';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <SlackInstallPage />
      </Suspense>
    </div>
  );
}
