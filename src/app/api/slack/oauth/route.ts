import { NextRequest, NextResponse } from "next/server";
import app, { installationStore } from "@/lib/slack/app";
import { slackConfig } from "@/lib/slack/config";
import type { Installation } from "@slack/bolt";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    // const state = url.searchParams.get('state'); // TODO: Add state validation

    if (!code) {
        return new Response("Missing 'code' parameter", { status: 400 });
    }

    // Determine the base URL dynamically. This is crucial for both the redirect_uri
    // and the final success/failure redirects.
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const protocol = 'https';
    const appUrl = host ? `${protocol}://${host}` : '';
    
    try {
        if (!appUrl) {
            throw new Error("Could not determine host from request headers.");
        }

        // The redirect_uri must exactly match the one used in the auth-url endpoint
        // AND one of the whitelisted URIs in your Slack App config.
        const redirectUri = `${appUrl}/api/slack/oauth`;

        // Manually perform the OAuth exchange, including the redirect_uri.
        const oauthResponse = await app.client.oauth.v2.access({
            code: code,
            client_id: slackConfig.clientId!,
            client_secret: slackConfig.clientSecret!,
            redirect_uri: redirectUri,
        });

        // The type of oauthResponse is OAuthV2AccessResponse, which is compatible with Installation.
        // We cast it to Installation to satisfy the storeInstallation method's type requirement.
        const installation = oauthResponse as unknown as Installation;

        // Manually store the installation in Firestore
        if (installationStore) {
            await installationStore.storeInstallation(installation);
        } else {
            throw new Error("Slack app installation store is not configured.");
        }
        
        const successUrl = new URL('/', appUrl);
        successUrl.searchParams.set('install', 'success');
        return NextResponse.redirect(successUrl);

    } catch (error: any) {
        console.error("Slack OAuth Error:", error.message);

        const failureUrl = new URL('/', appUrl);
        failureUrl.searchParams.set('install', 'failure');
        failureUrl.searchParams.set('error', error.data?.error || error.message || 'Unknown error');
        return NextResponse.redirect(failureUrl);
    }
}
