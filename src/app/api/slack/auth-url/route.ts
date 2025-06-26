import { NextRequest, NextResponse } from "next/server";
import { slackConfig, getMissingEnvVariableNames } from "@/lib/slack/config";

export async function GET(req: NextRequest) {
    try {
        const requiredVars: (keyof typeof slackConfig)[] = ['clientId', 'scopes', 'appUrl'];
        const missingVars = getMissingEnvVariableNames(requiredVars);

        if (missingVars.length > 0) {
            const errorMessage = `The following environment variables are not set: ${missingVars.join(', ')}. Please check your .env file.`;
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const { clientId, scopes, appUrl } = slackConfig;
        
        // The redirect URI must be whitelisted in your Slack App configuration
        // and must be consistent across the entire OAuth flow.
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
