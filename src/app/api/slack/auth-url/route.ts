import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const clientId = process.env.SLACK_CLIENT_ID;
        const scopes = process.env.NEXT_PUBLIC_SLACK_SCOPES;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!clientId || !scopes) {
            console.error("Slack client ID or scopes not set on the server.");
            return NextResponse.json(
                { error: "Slack integration not configured on the server." },
                { status: 500 }
            );
        }

        if (!appUrl) {
            console.error("NEXT_PUBLIC_APP_URL is not set in your environment variables.");
             return NextResponse.json(
                { error: "Application URL is not configured on the server." },
                { status: 500 }
            );
        }

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
