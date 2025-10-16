const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand } = require("@aws-sdk/lib-dynamodb");
const ulid = require("ulid");
const { TweetTypes } = require("../lib/constants");
const { extractHashtags } = require("../lib/utils");
const { USERS_TABLE, REGION, TWEETS_TABLE, TIMELINES_TABLE } = process.env;

const ddb = new DynamoDBClient({ region: REGION });
const client = DynamoDBDocumentClient.from(ddb);

module.exports.handler = async (event) => {
    try {
        if (!USERS_TABLE || !TWEETS_TABLE || !TIMELINES_TABLE || !REGION) {
            throw Error("Missing environment variables")
        }

        const { text } = event.arguments;
        const { username } = event.identity;

        if (!text || !username) {
            throw Error("Cannot create tweet, missing requirements [text, username]")
        }


        const id = ulid.ulid();
        const timestamp = new Date().toJSON();

        const hashtags = extractHashtags(text);

        let newTweet = {
            __typename: TweetTypes.TWEET,
            id,
            author: username,
            text,
            createdAt: timestamp,
            replies: 0,
            likes: 0,
            retweets: 0,
            liked: false,
            retweeted: false,
        }

        if (hashtags) {
            newTweet = Object.assign({}, newTweet, { hashtags })
        }

        const newTimeline = {
            userId: username,
            tweetId: id,
            timestamp
        }
        const input = {
            TransactItems: [
                {
                    Put: {
                        TableName: TWEETS_TABLE,
                        Item: newTweet
                    }
                },
                {
                    Put: {
                        TableName: TIMELINES_TABLE,
                        Item: newTimeline
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
                }
            ]
        };
        const command = new TransactWriteCommand(input);
        const resp = await client.send(command)
        if (resp.$metadata.httpStatusCode !== 200) {
            console.info('TransactiWrite ::', resp)
            throw Error('Problems with TransactiWrite')
        }
        return newTweet;
    } catch (err) {
        console.error("Err [tweet] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}