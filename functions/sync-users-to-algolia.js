const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { initUsersIndex } = require("../lib/algolia");
const { STAGE, ALGOLIA_APP_ID, ALGOLIA_WRT_KEY } = process.env;


module.exports.handler = async (event) => {
    try {
        if (!STAGE || !ALGOLIA_APP_ID || !ALGOLIA_WRT_KEY) {
            throw Error("Missing environment variables")
        }

        const usersIndex = initUsersIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRT_KEY,
            stage: STAGE
        })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT' || record.eventName == 'MODIFY') {
                const userProfile = unmarshall(record.dynamodb.NewImage);

                userProfile.objectID = userProfile.id;

                usersIndex.saveObjects([userProfile])
            }
            if (record.eventName == 'REMOVE') {
                const userProfile = unmarshall(record.dynamodb.OldImage);
               
                usersIndex.deleteObjects([userProfile.id])
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