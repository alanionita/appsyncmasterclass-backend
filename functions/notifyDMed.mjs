import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import { GraplQLClient } from "../lib/graphql.mjs";
const { REGION, APPSYNC_URL } = process.env;

export async function handler(event) {
    try {
        if (!REGION || !APPSYNC_URL) {
            throw Error("Missing environment variables")
        }
        const appsyncClient = new GraplQLClient({ region: REGION, appSyncUrl: APPSYNC_URL })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT') {
                const dm = unmarshall(record.dynamodb.NewImage);
                const users = dm.conversationId.split('_');
                const userId = users.filter(user => user !== dm.from)[0];

                const variables = {
                    id: ulid(),
                    userId,
                    otherUserId: dm.from,
                    message: dm.message
                }
                await appsyncClient.notifyDMed(variables)
    
            }
        }
    } catch (err) {
        console.error("Err [notify-dmed] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}