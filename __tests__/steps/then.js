const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { USERS_TABLE, REGION } = process.env;
require('dotenv').config()


async function user_exists(userID) {
    try {
        console.info(`Getting [${userID}] from table [${USERS_TABLE}] `)
        
        const client = new DynamoDBClient({ region: REGION });

        const input = {
            TableName: USERS_TABLE,
            Key: {
                id: {
                    "S": userID
                }
            }
        };
        const command = new GetItemCommand(input);
        const resp = await client.send(command)
        
        // Convert to JSON
        const item = unmarshall(resp.Item)
        expect(item).toBeTruthy()
        return item
    } catch (err) {
        console.error('Err [tests/steps/then/user_exists] ::', err.message)
        console.info(JSON.stringify(err))
       
    }

}

module.exports = {
    user_exists
}