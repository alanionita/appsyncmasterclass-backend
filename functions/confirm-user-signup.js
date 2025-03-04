const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { USERS_TABLE, REGION } = process.env;
const Chance = require('chance');
const chance = new Chance();

const client = new DynamoDBClient({ region: REGION });

module.exports.handler = async (event) => {
    try {
        const name = event.request.userAttributes('name')
        const suffix = chance.string({
            length: 8,
            casing: 'upper',
            alpha: true,
            numeric: true
        })
        const patternNotAlphaNum = /[^a-zA-Z0-9]/g;
        const screenName = `${name.replace(patternNotAlphaNum, "")}${suffix}`
        const user = {
            id: event.userName,
            name,
            screenName,
            createdAt: new Date().toJSON(),
            followersCount: 0,
            followingCount: 0,
            tweetsCount: 0,
            likesCount: 0
        }
        if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
            const input = {
                TableName: USERS_TABLE,
                Item: user,
                ConditionExpression: "attribute_not_exists(id)" // Block duplicate inserts
            };
            const command = new PutItemCommand(input);
            await client.send(command)
            return event;
        }

        return event;
    } catch (err) {
        console.error("Err [confirm-user-signup]", err.message)
        console.info({...err.$metadata})
        console.info(JSON.stringify(err))
    }
}