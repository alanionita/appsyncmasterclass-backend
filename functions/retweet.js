const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const ulid = require("ulid");
const { TweetTypes } = require("../lib/constants");
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
            throw Error("Cannot retweet, missing requirements [tweetId, username]")
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


        const id = ulid.ulid();
        const timestamp = new Date().toJSON();

        const newTweet = {
            __typename: TweetTypes.RETWEET,
            id,
            author: username,
            createdAt: timestamp,
            retweetOf: originalTweet.id
        }

        const newRetweet = {
            userId: username,
            tweetId,
            createAt: timestamp
        }

        const newTimeline = {
            userId: username,
            tweetId: id,
            timestamp,
            retweetOf: originalTweet.id
        }

        const transactItems = [
            {
                Put: {
                    TableName: TWEETS_TABLE,
                    Item: newTweet
                }
            },
            {
                Put: {
                    TableName: RETWEETS_TABLE,
                    Item: newRetweet
                }
            },

            {
                Update: {
                    TableName: USERS_TABLE,
                    Key: {
                        id: username
                    },
                    UpdateExpression: 'ADD tweetsCount :incr',
                    ExpressionAttributeValues: {
                        ":incr": 1
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
                    UpdateExpression: 'ADD retweets :incr',
                    ExpressionAttributeValues: {
                        ":incr": 1
                    },
                    ConditionExpression: "attribute_exists(id)"
                }
            }
        ]

        if (originalTweet.author !== username) {
            
            transactItems.push({
                Put: {
                    TableName: TIMELINES_TABLE,
                    Item: newTimeline
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
        return newTweet;
    } catch (err) {
        console.error("Err [retweet] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}