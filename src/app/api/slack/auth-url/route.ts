import { NextRequest, NextResponse } from "next/server";
import { slackConfig, getMissingEnvVariableNames } from "@/lib/slack/config";

export async function GET(req: NextRequest) {
    try {
        const requiredVarsForAuthUrl: (keyof typeof slackConfig)[] = ['clientId', 'scopes', 'appUrl'];
        const missingVars = getMissingEnvVariableNames(requiredVarsForAuthUrl);

        if (missingVars.length > 0) {
            const errorMessage = `The following environment variables are not set: ${missingVars.join(', ')}. Please check your .env file.`;
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        // All required variables are present, so we can use the non-null assertion operator (!)
        const clientId = slackConfig.clientId!;
        const scopes = slackConfig.scopes!;
        const appUrl = slackConfig.appUrl!;

        // The redirect URI must be whitelisted in your Slack App configuration.
        const redirectUri = `${appUrl}/api/slack/oauth`;

        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}`;

        return NextResponse.json({ url });

    } catch (error) {
        console.error("Error generating Slack auth URL:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
