import { NextRequest, NextResponse } from "next/server";
import app from "@/lib/slack/app";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // The stateSecret from the App constructor is used to sign the state,
    // and the installer will verify it by default.
    if (!code) {
        return new Response("Missing 'code' parameter", { status: 400 });
    }

    try {
        // This exchanges the code for a token and stores the installation.
        // It relies on the `installationStore` configured in the App.
        await app.installer?.handleCallback(req, new NextResponse() as any, {
            // handleCallback will call oauth.v2.access and then storeInstallation
        });

        const successUrl = new URL('/', req.url);
        successUrl.searchParams.set('install', 'success');
        return NextResponse.redirect(successUrl);

    } catch (error: any) {
        console.error("Slack OAuth Error:", error);
        const failureUrl = new URL('/', req.url);
        failureUrl.searchParams.set('install', 'failure');
        failureUrl.searchParams.set('error', error.code || 'Unknown error');
        return NextResponse.redirect(failureUrl);
    }
}
