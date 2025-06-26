import { NextRequest, NextResponse } from "next/server";
import app from "@/lib/slack/app";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
        return new Response("Missing 'code' parameter", { status: 400 });
    }

    try {
        await app.installer?.handleCallback(req, new NextResponse() as any, {
            // handleCallback will call oauth.v2.access and then storeInstallation
        });
        
        // Dynamically determine the base URL for the redirect
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
        console.error("Slack OAuth Error:", error);

        // Dynamically determine the base URL for the failure redirect
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        const protocol = 'https';
        // If host can't be determined, redirect to a relative path as a fallback.
        const appUrl = host ? `${protocol}://${host}` : '';

        const failureUrl = new URL('/', appUrl);
        failureUrl.searchParams.set('install', 'failure');
        failureUrl.searchParams.set('error', error.code || 'Unknown error');
        return NextResponse.redirect(failureUrl);
    }
}
