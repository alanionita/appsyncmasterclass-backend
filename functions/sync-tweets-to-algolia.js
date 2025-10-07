const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { initTweetsIndex } = require("../lib/algolia");
const { TweetTypes } = require("../lib/constants");
const { STAGE, ALGOLIA_APP_ID, ALGOLIA_WRT_KEY } = process.env;


module.exports.handler = async (event) => {
    try {
        if (!STAGE || !ALGOLIA_APP_ID || !ALGOLIA_WRT_KEY) {
            throw Error("Missing environment variables")
        }

        const tweetsIndex = initTweetsIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRT_KEY,
            stage: STAGE
        })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT' || record.eventName == 'MODIFY') {
                const tweet = unmarshall(record.dynamodb.NewImage);

                if (tweet.__typename == TweetTypes.RETWEET) {
                    continue;
                }

                tweet.objectID = tweet.id;

                tweetsIndex.saveObjects([tweet])
            }
            if (record.eventName == 'REMOVE') {
                const tweet = unmarshall(record.dynamodb.OldImage);
               
                if (tweet.__typename == TweetTypes.RETWEET) {
                    continue;
                }

                tweetsIndex.deleteObjects([tweet.id])
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