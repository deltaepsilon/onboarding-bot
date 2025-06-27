import { NextRequest, NextResponse } from 'next/server';
import app, { installationStore } from '@/lib/slack/app';
import { slackConfig } from '@/lib/slack/config';
import type { Installation } from '@slack/bolt';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  // const state = url.searchParams.get('state'); // TODO: Add state validation

  if (!code) {
    return new Response("Missing 'code' parameter", { status: 400 });
  }

  const appUrl = slackConfig.appUrl;

  try {
    if (!appUrl) {
      throw new Error('APP_URL is not configured in environment variables.');
    }

    const redirectUri = `${appUrl}/api/slack/oauth`;

    // Manually perform the OAuth exchange
    const oauthResponse = await app.client.oauth.v2.access({
      code: code,
      client_id: slackConfig.clientId!,
      client_secret: slackConfig.clientSecret!,
      redirect_uri: redirectUri,
    });

    if (!oauthResponse.ok) {
      const errorMessage = oauthResponse.error || 'Unknown OAuth error';
      console.error(`Slack OAuth Error: ${errorMessage}`);
      throw new Error(`Slack OAuth failed: ${errorMessage}`);
    }

    // Manually construct the installation object to avoid relying on the
    // sometimes-unavailable `app.installer` property in serverless environments.
    const installation: Installation = {
      team: oauthResponse.team as { id: string; name: string } | undefined,
      enterprise: oauthResponse.enterprise as { id: string; name: string } | undefined,
      // @ts-ignore
      user: {
        id: (oauthResponse.authed_user as any).id,
      },
      tokenType: oauthResponse.token_type as 'bot',
      isEnterpriseInstall: oauthResponse.is_enterprise_install,
      appId: oauthResponse.app_id,
      authVersion: 'v2',
    };

    // User token and scopes are optional. Only add them if they exist in the response
    // to avoid writing 'undefined' to Firestore.
    if ((oauthResponse.authed_user as any)?.access_token) {
      installation.user.token = (oauthResponse.authed_user as any).access_token;
    }
    if ((oauthResponse.authed_user as any)?.scope) {
      installation.user.scopes = (oauthResponse.authed_user as any).scope.split(',');
    }

    // Add bot info if it exists in the response. This is required for a bot to operate.
    if (oauthResponse.access_token && oauthResponse.bot_user_id && oauthResponse.scope) {
      installation.bot = {
        id: oauthResponse.bot_user_id,
        userId: oauthResponse.bot_user_id,
        scopes: oauthResponse.scope.split(','),
        token: oauthResponse.access_token,
      };
    } else {
      throw new Error('Installation failed: Bot token or user ID not found in OAuth response.');
    }

    await installationStore.storeInstallation(installation);

    const successUrl = new URL('/', appUrl);
    successUrl.searchParams.set('install', 'success');
    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Slack OAuth Error:', error.message);

    const failureUrl = new URL(appUrl || req.nextUrl.origin);
    failureUrl.pathname = '/';
    failureUrl.searchParams.set('install', 'failure');
    failureUrl.searchParams.set('error', error.data?.error || error.message || 'Unknown error');
    return NextResponse.redirect(failureUrl);
  }
}
