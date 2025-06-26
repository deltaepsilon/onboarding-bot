import { NextRequest, NextResponse } from "next/server";
import app from "@/lib/slack/app";
import { slackConfig } from "@/lib/slack/config";
import type { Installation } from "@slack/bolt";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    // const state = url.searchParams.get('state'); // TODO: Add state validation

    if (!code) {
        return new Response("Missing 'code' parameter", { status: 400 });
    }

    try {
        // Construct the redirect_uri from the incoming request. It must match
        // the one used in the initial auth-url endpoint.
        const redirectUri = `${new URL(req.url).origin}/api/slack/oauth`;

        // Manually perform the OAuth exchange. This is more reliable in serverless
        // environments than relying on `handleCallback` with incompatible req/res objects.
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
        if (app.installer) {
            await app.installer.storeInstallation(installation);
        } else {
            throw new Error("Slack app installer is not configured.");
        }
        
        // Determine the base URL for the final success redirect
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        if (!host) {
             throw new Error("Could not determine host from request headers.");
        }
        const protocol = 'https';
        const appUrl = `${protocol}://${host}`;

        const successUrl = new URL('/', appUrl);
        successUrl.searchParams.set('install', 'success');
        return NextResponse.redirect(successUrl);

    } catch (error: any) {
        console.error("Slack OAuth Error:", error.message);

        // Determine the base URL for the failure redirect
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        const protocol = 'https';
        const appUrl = host ? `${protocol}://${host}` : '';

        const failureUrl = new URL('/', appUrl);
        failureUrl.searchParams.set('install', 'failure');
        failureUrl.searchParams.set('error', error.data?.error || error.message || 'Unknown error');
        return NextResponse.redirect(failureUrl);
    }
}
