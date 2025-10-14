import AWS from 'aws-sdk'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as path from 'path';
import dotenv from 'dotenv'

const __dirname = import.meta.dirname;

dotenv.config({ path: path.resolve(__dirname, '../.env'), })

AWS.config.region = process.env.REGION

const run = async () => {
    const loop = async (exclusiveStartKey) => {
        try {

            const ddb = new DynamoDBClient({ region: process.env.REGION });
            const client = new DynamoDBDocumentClient(ddb)

            const input = {
                TableName: process.env.USERS_TABLE,
                ExclusiveStartKey: exclusiveStartKey,
                Limit: 100
            };

            const command = new ScanCommand(input);
            const ddbResp = await client.send(command)

            if (ddbResp.$metadata.httpStatusCode === 200) {
                const updatePromises = ddbResp.Items.map(async x => {
                    const updateInput = {
                        TableName: process.env.USERS_TABLE,
                        Key: {
                            id: x.id
                        },
                        UpdateExpression: "SET lastUpdated = :now",
                        ExpressionAttributeValues: {
                            ":now": new Date().toJSON()
                        }
                    }

                    const command = new UpdateCommand(updateInput)
                    await client.send(command)
                })
                await Promise.all(updatePromises)
                if (ddbResp.LastEvaluatedKey) {
                    return await loop(ddbResp.LastEvaluatedKey)
                }
            }
        } catch (err) {
            console.error('Err [scripts/users-update-lastUpdated] : ', err.message)
            console.info(JSON.stringify(err))
        }
    }

    await loop()
}

run().then(x => console.info('INFO [scripts/users-update-lastUpdated] : DONE'))