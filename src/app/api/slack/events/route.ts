import { NextRequest } from 'next/server';
import app from '@/lib/slack/app';

export async function POST(req: NextRequest) {
  const clonedReq = req.clone();
  const body = await clonedReq.json();

  if (body.type === 'url_verification') {
    return new Response(body.challenge);
  }

  try {
    let acknowledged = false;
    let response;

    app
      .processEvent({
        body,
        ack: async (res) => {
          if (acknowledged) return;

          if (res instanceof Error) {
            console.error('⚠️ Error acknowledging Slack event:', res);
          } else {
            response = res || '';
          }

          acknowledged = true;
        },
      })
      .catch(() => {});

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error processing Slack event:', error);
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
