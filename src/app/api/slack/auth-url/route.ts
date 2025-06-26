import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const clientId = process.env.SLACK_CLIENT_ID;
        const scopes = process.env.NEXT_PUBLIC_SLACK_SCOPES;
        
        // The redirect URI needs to be determined based on the request's origin
        // to work correctly in different environments (local, staging, prod).
        const redirectUri = `${req.nextUrl.origin}/api/slack/oauth`;

        if (!clientId || !scopes) {
            console.error("Slack environment variables not set on the server.");
            return NextResponse.json(
                { error: "Slack integration not configured on the server." },
                { status: 500 }
            );
        }

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
