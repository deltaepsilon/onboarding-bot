import { NextRequest, NextResponse } from "next/server";
import { slackConfig, getMissingEnvVariableNames } from "@/lib/slack/config";

export async function GET(req: NextRequest) {
    try {
        // We no longer need to check for 'appUrl' here as it's determined dynamically.
        const requiredVarsForAuthUrl: (keyof typeof slackConfig)[] = ['clientId', 'scopes'];
        const missingVars = getMissingEnvVariableNames(requiredVarsForAuthUrl);

        if (missingVars.length > 0) {
            const errorMessage = `The following environment variables are not set: ${missingVars.join(', ')}. Please check your .env file.`;
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const clientId = slackConfig.clientId!;
        const scopes = slackConfig.scopes!;
        
        // Dynamically determine the app's URL from the request headers
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        if (!host) {
             throw new Error("Could not determine host from request headers.");
        }
        // The protocol is always https in this cloud environment.
        const protocol = 'https';
        const appUrl = `${protocol}://${host}`;


        // The redirect URI must be whitelisted in your Slack App configuration.
        const redirectUri = `${appUrl}/api/slack/oauth`;

        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}`;

        return NextResponse.json({ url });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Error generating Slack auth URL:", errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
