import { NextRequest } from "next/server";
import app from "@/lib/slack/app";
import { CodedError } from "@slack/bolt";

export async function POST(req: NextRequest) {
    const clonedReq = req.clone();
    const body = await clonedReq.json();

    try {
        // Let the Bolt app handle the event
        const result = await app.processEvent({
            body,
            headers: req.headers,
            ack: async (response) => {
                // Bolt's `ack` function is handled internally when processBeforeResponse is true.
                // This is a placeholder.
                return new Response(response ?? "", { status: 200 });
            }
        });

        // processEvent will throw an error if something goes wrong
        if (result?.ack) {
           return new Response(result.ack.body, { status: result.ack.statusCode });
        }
        
        return new Response("", { status: 200 });

    } catch (error) {
        console.error("Error processing Slack event:", error);
        if (error instanceof CodedError) {
             return new Response(error.message, { status: 500 });
        }
        return new Response("Internal Server Error", { status: 500 });
    }
}
