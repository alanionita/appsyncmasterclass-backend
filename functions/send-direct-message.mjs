import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";


export async function handler(event) {
    try {
        const { CONVERSATIONS_TABLE, DIRECT_MESSAGES_TABLE, REGION } = process.env;
        if (!CONVERSATIONS_TABLE || !DIRECT_MESSAGES_TABLE || !REGION) {
            throw Error("Missing environment variables")
        }

        const ddb = new DynamoDBClient({ region: REGION });
        const client = DynamoDBDocumentClient.from(ddb);

        const { otherUserId, message } = event.arguments;
        const { username } = event.identity;

        if (!username || !otherUserId || !message) {
            throw Error("Malformed request")
        }

        const messageId = ulid();
        const timestamp = new Date().toJSON();
        const conversationId = username < otherUserId
            ? `${username}_${otherUserId}`
            : `${otherUserId}_${username}`

        const newMessage = {
            conversationId,
            messageId,
            from: username,
            message,
            timestamp
        }

        const transactItems = [
            {
                Put: {
                    TableName: DIRECT_MESSAGES_TABLE,
                    Item: newMessage
                }
            },
            {
                Update: {
                    TableName: CONVERSATIONS_TABLE,
                    Key: {
                        userId: username,
                        otherUserId
                    },
                    UpdateExpression: 'SET id = :id, lastMessage = :lastMessage, lastModified = :now',
                    ExpressionAttributeValues: {
                        ":id": conversationId,
                        ":lastMessage": message,
                        ":now": timestamp
                    },
                }
            },
            {
                Update: {
                    TableName: CONVERSATIONS_TABLE,
                    Key: {
                        userId: otherUserId,
                        otherUserId: username
                    },
                    UpdateExpression: 'SET id = :id, lastMessage = :lastMessage, lastModified = :now',
                    ExpressionAttributeValues: {
                        ":id": conversationId,
                        ":lastMessage": message,
                        ":now": timestamp
                    },
                }
            }
        ]

        const input = {
            TransactItems: transactItems
        };
        const command = new TransactWriteCommand(input);
        const resp = await client.send(command)
        if (resp.$metadata.httpStatusCode !== 200) {
            console.info('TransactiWrite ::', resp)
            throw Error('Problems with TransactiWrite')
        }
        return {
            id: conversationId,
            otherUserId: otherUserId,
            lastMessage: message,
            lastModified: timestamp,
        };
    } catch (err) {
        console.error("Err [send-direct-message] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}