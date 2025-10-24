import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import ddb from "../lib/dynamodb.js";
import { GraplQLClient } from "../lib/graphql.mjs";
const { REGION, TWEETS_TABLE, APPSYNC_URL } = process.env;

export async function handler(event) {
    try {
        if (!TWEETS_TABLE || !REGION || !APPSYNC_URL) {
            throw Error("Missing environment variables")
        }
        const tweetsModel = new ddb({ region: REGION, tableName: TWEETS_TABLE });
        const appsyncClient = new GraplQLClient({ region: REGION, appSyncUrl: APPSYNC_URL })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT') {
                const like = unmarshall(record.dynamodb.NewImage);
                const { tweetId, userId } = like;

                if (!tweetId && !userId) {
                    throw Error("Malformed record")
                }

                const originalTweet = await tweetsModel.getItem(tweetId);

                if (!originalTweet.author && !originalTweet.id) {
                    throw Error("Malformed tweet record")
                }

                const variables = {
                    id: ulid(),
                    userId: originalTweet.author,
                    tweetId: originalTweet.id,
                    likedBy: userId
                }
                await appsyncClient.notifyLiked(variables)
    
            }
        }
    } catch (err) {
        console.error("Err [notify] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}