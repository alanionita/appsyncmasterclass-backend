import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import ddb from "../lib/dynamodb.js";
import { GraplQLClient } from "../lib/graphql.mjs";
const { REGION, TWEETS_TABLE, APPSYNC_URL } = process.env;

const TweetTypes = {
    TWEET: 'Tweet',
    RETWEET: 'Retweet',
    REPLY: 'Reply'
}

export async function handler(event) {
    try {
        if (!TWEETS_TABLE || !REGION || !APPSYNC_URL) {
            throw Error("Missing environment variables")
        }
        const tweetsModel = new ddb({ region: REGION, tableName: TWEETS_TABLE });
        const appsyncClient = new GraplQLClient({ region: REGION, appSyncUrl: APPSYNC_URL })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT') {
                const tweet = unmarshall(record.dynamodb.NewImage);
                const { __typename, retweetOf } = tweet;

                if (!__typename && !retweetOf) {
                    throw Error("Malformed record")
                }

                switch (__typename) {
                    case TweetTypes.RETWEET:
                        const retweetOf = await tweetsModel.getItem(tweet.retweetOf);
                        const variables = {
                            id: ulid(),
                            userId: retweetOf.author,
                            tweetId: retweetOf.id,
                            retweetId: tweet.id,
                            retweetedBy: tweet.author
                        }
                        await appsyncClient.notifyRetweeted(variables)
                }
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