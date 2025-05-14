const ddbLib = require("../lib/dynamodb");
const { chunk } = require("../lib/utils");
const Constants = require("../lib/constants");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { RELATIONSHIPS_TABLE, REGION, TIMELINES_TABLE } = process.env;

module.exports.handler = async (event) => {
    try {
        if (!TIMELINES_TABLE || !REGION || !RELATIONSHIPS_TABLE) {
            throw Error("Missing environment variables")
        }
        const timelineModel = new ddbLib({ region: REGION, tableName: TIMELINES_TABLE })
        const relationshipsModel = new ddbLib({ region: REGION, tableName: RELATIONSHIPS_TABLE })

        for (let record of event.Records) {
             if (record.eventName == 'INSERT') {
                const tweet = unmarshall(record.dynamodb.NewImage);
                const followers = await getFollowers(relationshipsModel, tweet.author);
                return await distributeTweet({ model: timelineModel, tweet, followers });
            }
            if (record.eventName == 'REMOVE') {
                const tweet = unmarshall(record.dynamodb.OldImage);
                const followers = await getFollowers(relationshipsModel, tweet.author);
               
                return await undistributeTweet({ model: timelineModel, tweet, followers });
            }
        }
    } catch (err) {
        console.error("Err [distributeTweets] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

async function getFollowers(model, author) {
    try {
        const getAll = async (acc, exclusiveStartKey) => {
            const input = {
                TableName: RELATIONSHIPS_TABLE,
                IndexName: 'byOtherUser',
                KeyConditionExpression: 'otherUserId = :otherUserId and begins_with(sk, :follows)',
                ExpressionAttributeValues: {
                    ':otherUserId': author,
                    ':follows': 'FOLLOWS_'
                },
                ProjectionExpression: 'userId',
                ExclusiveStartKey: exclusiveStartKey
            }
            const resp = await model.query(input)

            if (resp.LastEvaluatedKey) {
                return await getAll(acc.concat(resp.Items), resp.LastEvaluatedKey)
            } else {
                return acc.concat(resp.Items)
            }
        }

        return await getAll([]);
    } catch (caught) {
        console.error("Err [getFollowers] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}

async function distributeTweet({ model, tweet, followers }) {
    try {
        const items = followers.map(follower => {
            return {
                PutRequest: {
                    Item: {
                        userId: follower.userId,
                        tweetId: tweet.id,
                        timestamp: tweet.createAt,
                        retweetOf: tweet.retweetOf,
                        inReplyToTweetId: tweet.inReplyToTweetId,
                        inReplyToUserIds: tweet.inReplyToUserIds
                    }
                }
            }
        })
        const chunks = chunk(items, Constants.DynamoDB.MAX_BATCH_SIZE)
        const promises = chunks.map(async chunk => {
            const input = {
                RequestItems: {
                    [TIMELINES_TABLE]: chunk
                }
            }
            await model.batchWrite(input);
        })

        return Promise.all(promises)
    } catch (caught) {
        console.error("Err [distributeTweet] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}

async function undistributeTweet({ model, tweet, followers }) {
    try {
        const items = followers.map(follower => {
            return {
                DeleteRequest: {
                    Key: {
                        userId: follower.userId,
                        tweetId: tweet.id
                    }
                }
            }
        })

        const chunks = chunk(items, Constants.DynamoDB.MAX_BATCH_SIZE)
        const promises = chunks.map(async chunk => {
            const input = {
                RequestItems: {
                    [TIMELINES_TABLE]: chunk
                }
            }
            await model.batchWrite(input);
        })

        return Promise.all(promises)
    } catch (caught) {
        console.error("Err [undistributeTweet] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}