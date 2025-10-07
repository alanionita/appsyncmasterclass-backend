import { unmarshall } from "@aws-sdk/util-dynamodb"
import ssm from '@middy/ssm'
import middy from '@middy/core'
import { initUsersIndex } from "../lib/algolia.mjs"

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

        const usersIndex = await initUsersIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRITE_KEY,
            stage: STAGE
        })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT' || record.eventName == 'MODIFY') {
                const userProfile = unmarshall(record.dynamodb.NewImage);

                userProfile.objectID = userProfile.id;

                await usersIndex.saveObjects([userProfile])
            }
            if (record.eventName == 'REMOVE') {
                const userProfile = unmarshall(record.dynamodb.OldImage);

                await usersIndex.deleteObjects([userProfile.id])
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
