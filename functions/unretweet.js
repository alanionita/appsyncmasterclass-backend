const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { USERS_TABLE, REGION, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env;

const ddb = new DynamoDBClient({ region: REGION });
const client = DynamoDBDocumentClient.from(ddb);

module.exports.handler = async (event) => {
    try {
        if (!USERS_TABLE || !TWEETS_TABLE || !TIMELINES_TABLE || !REGION || !RETWEETS_TABLE) {
            throw Error("Missing environment variables")
        }

        const { tweetId } = event.arguments;
        const { username } = event.identity;

        if (!tweetId || !username) {
            throw Error("Cannot unretweet, missing requirements [tweetId, username]")
        }

        const getCmd = new GetCommand({
            TableName: TWEETS_TABLE,
            Key: {
                id: tweetId
            }
        })

        const getTweetResp = await client.send(getCmd)

        const originalTweet = getTweetResp.Item

        if (!originalTweet) {
            throw Error('Original tweet not found.')
        }
        const queryInput = {
            TableName: TWEETS_TABLE,
            IndexName: 'retweets',
            KeyConditionExpression: "author = :author AND retweetOf = :retweetOf",
            ExpressionAttributeValues: {
                ":author": username,
                ":retweetOf": tweetId
            },
            Limit: 1
        };
        const queryCmd = new QueryCommand(queryInput);

        const getRetweetResp = await client.send(queryCmd)

        const retweet = getRetweetResp.Items[0]

        if (!retweet) {
            throw Error('Retweet not found.')
        }

        const transactItems = [
            {
                Delete: {
                    TableName: TWEETS_TABLE,
                    Key: {
                        id: retweet.id
                    },
                    ConditionExpression: "attribute_exists(id)"
                }
            },
            {
                Delete: {
                    TableName: RETWEETS_TABLE,
                    Key: {
                        userId: username,
                        tweetId: originalTweet.id,
                    },
                    ConditionExpression: "attribute_exists(tweetId)"
                }
            },
            {
                Update: {
                    TableName: USERS_TABLE,
                    Key: {
                        id: username
                    },
                    UpdateExpression: 'ADD tweetsCount :decr',
                    ExpressionAttributeValues: {
                        ":decr": -1
                    },
                    ConditionExpression: "attribute_exists(id)"
                }
            },
            {
                Update: {
                    TableName: TWEETS_TABLE,
                    Key: {
                        id: tweetId
                    },
                    UpdateExpression: 'ADD retweets :decr',
                    ExpressionAttributeValues: {
                        ":decr": -1
                    },
                    ConditionExpression: "attribute_exists(id)"
                }
            }
        ]

        if (originalTweet.author !== username) {
            transactItems.push({
                Delete: {
                    TableName: TIMELINES_TABLE,
                    Key: {
                        userId: username,
                        tweetId: retweet.id,
                    }
                }
            })
        }

        const input = {
            TransactItems: transactItems
        };
        const command = new TransactWriteCommand(input);
        const resp = await client.send(command)
        if (resp.$metadata.httpStatusCode !== 200) {
            console.info('TransactiWrite ::', resp)
            throw Error('Problems with TransactiWrite')
        }
        return true;
    } catch (err) {
        console.error("Err [unretweet] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}