import { unmarshall } from "@aws-sdk/util-dynamodb"
import { initTweetsIndex } from "../lib/algolia.mjs"
import ssm from '@middy/ssm'
import middy from '@middy/core'

const TweetTypes = {
    TWEET: 'Tweet',
    RETWEET: 'Retweet',
    REPLY: 'Reply'
}

const { STAGE } = process.env;

async function lambdaHandler(event, context) {
    try {
        if (!STAGE) {
            throw Error("Missing environment variables")
        }

        const { ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY } = context;

        if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_KEY) {
            throw Error("Missing context variables")
        }

        const tweetsIndex = await initTweetsIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRITE_KEY,
            stage: STAGE
        })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT' || record.eventName == 'MODIFY') {
                const tweet = unmarshall(record.dynamodb.NewImage);

                if (tweet.__typename == TweetTypes.RETWEET) {
                    continue;
                }

                tweet.objectID = tweet.id;

                await tweetsIndex.saveObjects([tweet])
            }
            if (record.eventName == 'REMOVE') {
                const tweet = unmarshall(record.dynamodb.OldImage);

                if (tweet.__typename == TweetTypes.RETWEET) {
                    continue;
                }

                await tweetsIndex.deleteObjects([tweet.id])
            }
        }
    } catch (err) {
        console.error("Err [sync-users-to-algolia] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

export const handler = middy()
    .use(
        ssm({
            fetchData: {
                ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
                ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
            },
            setToContext: true,
            cacheExpiry: 5 * 60 * 1000, // 5 mins
        })
    )
    .handler(lambdaHandler)