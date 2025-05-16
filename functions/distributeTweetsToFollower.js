const ddbLib = require("../lib/dynamodb");
const { chunk } = require("../lib/utils");
const Constants = require("../lib/constants");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { TWEETS_TABLE, REGION, TIMELINES_TABLE, MAX_TWEETS } = process.env;


module.exports.handler = async (event) => {
    try {
        if (!TIMELINES_TABLE || !REGION || !TWEETS_TABLE || !MAX_TWEETS) {
            throw Error("Missing environment variables")
        }
        const maxTweets = Number(MAX_TWEETS)
        const timelineModel = new ddbLib({ region: REGION, tableName: TIMELINES_TABLE })
        const tweetsModel = new ddbLib({ region: REGION, tableName: TWEETS_TABLE })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT') {
                const relationship = unmarshall(record.dynamodb.NewImage);
                const followRel = relationship.sk.startsWith('FOLLOWS_')

                if (followRel) {
                    const tweets = await getTweets({
                        model: tweetsModel,
                        author: relationship.otherUserId,
                        limit: maxTweets
                    })

                    await distributeTweets({ model: timelineModel, tweets, follower: record.userId })
                }
            }
            if (record.eventName == 'REMOVE') {
                const relationship = unmarshall(record.dynamodb.NewImage);
                const followRel = relationship.sk.startsWith('FOLLOWS_')

                if (followRel) {
                    const tweets = await getTimelineItemsBy({
                        model: timelineModel,
                        distributedFrom: relationship.otherUserId,
                        userId: relationship.userId
                    })

                    await undistributeTweets({ model: timelineModel, tweets, follower: record.userId })
                }
            }
        }
    } catch (err) {
        console.error("Err [distributeTweetsToFollower] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

async function getTweets({ model, author, limit }) {
    try {
        const getAll = async (acc, exclusiveStartKey) => {
            const input = {
                TableName: TWEETS_TABLE,
                IndexName: 'byCreator',
                KeyConditionExpression: "author = :author",
                ExpressionAttributeValues: {
                    ":author": author,
                },
                ProjectionExpression: 'userId',
                ExclusiveStartKey: exclusiveStartKey,
            };

            const resp = await model.query(input)

            if (resp.LastEvaluatedKey && newAcc.length < limit) {
                return await getAll(acc.concat(resp.Items), resp.LastEvaluatedKey)
            } else {
                return acc.concat(resp.Items)
            }
        }

        return await getAll([]);
    } catch (caught) {
        console.error("Err [getTweets] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}

async function getTimelineItemsBy({
    model,
    distributedFrom,
    userId
}) {
    try {
        const getAll = async (acc, exclusiveStartKey) => {
            const input = {
                TableName: TIMELINES_TABLE,
                IndexName: 'distributedFrom',
                KeyConditionExpression: "userId = :userId and distributedFrom = :distributedFrom",
                ExpressionAttributeValues: {
                    ":userId": userId,
                    ":distributedFrom": distributedFrom
                },
                ExclusiveStartKey: exclusiveStartKey,
            };

            const resp = await model.query(input)

            if (resp.LastEvaluatedKey) {
                return await getAll(acc.concat(resp.Items), resp.LastEvaluatedKey)
            } else {
                return acc.concat(resp.Items)
            }
        }

        return await getAll([]);
    } catch (caught) {
        console.error("Err [getTimelineItemsBy] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}

async function distributeTweets({ model, tweets, follower }) {
    try {
        const items = tweets.map(tweet => {
            return {
                PutRequest: {
                    Item: {
                        userId: follower.userId,
                        tweetId: tweet.id,
                        timestamp: tweet.createAt,
                        retweetOf: tweet.retweetOf,
                        inReplyToTweetId: tweet.inReplyToTweetId,
                        inReplyToUserIds: tweet.inReplyToUserIds,
                        distributedFrom: tweet.author
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
        console.error("Err [distributeTweets] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}

async function undistributeTweets({ model, tweets, follower }) {
    try {
        const items = tweets.map(tweet => {
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
        console.error("Err [undistributeTweets] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}