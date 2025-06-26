import { NextRequest, NextResponse } from "next/server";
import app, { installationStore } from "@/lib/slack/app";
import { slackConfig } from "@/lib/slack/config";

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
            throw new Error("APP_URL is not configured in environment variables.");
        }

        const redirectUri = `${appUrl}/api/slack/oauth`;

        // Manually perform the OAuth exchange
        const oauthResponse = await app.client.oauth.v2.access({
            code: code,
            client_id: slackConfig.clientId!,
            client_secret: slackConfig.clientSecret!,
            redirect_uri: redirectUri,
        });

        // The raw oauthResponse is not in the shape the InstallationStore expects.
        // We use the installer's helper method to transform it.
        if (!app.installer) {
            throw new Error("Slack app installer is not configured.");
        }
        const installation = app.installer.toInstallation(oauthResponse);

        await installationStore.storeInstallation(installation);
        
        const successUrl = new URL('/', appUrl);
        successUrl.searchParams.set('install', 'success');
        return NextResponse.redirect(successUrl);

    } catch (error: any) {
        console.error("Slack OAuth Error:", error.message);

        const failureUrl = new URL(appUrl || req.nextUrl.origin);
        failureUrl.pathname = '/';
        failureUrl.searchParams.set('install', 'failure');
        failureUrl.searchParams.set('error', error.data?.error || error.message || 'Unknown error');
        return NextResponse.redirect(failureUrl);
    }
}
