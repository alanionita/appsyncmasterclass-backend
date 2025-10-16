const ulid = require("ulid");
const { TweetTypes } = require("../lib/constants");
const ddbLib = require("../lib/dynamodb");
const { extractHashtags } = require("../lib/utils");
const { USERS_TABLE, REGION, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env;

module.exports.handler = async (event) => {
    try {
        if (!USERS_TABLE || !TWEETS_TABLE || !TIMELINES_TABLE || !REGION || !RETWEETS_TABLE) {
            throw Error("Missing environment variables")
        }
        const tweetsModel = new ddbLib({ region: REGION, tableName: TWEETS_TABLE })

        const { tweetId, text } = event.arguments;
        const { username } = event.identity;

        if (!tweetId) {
            throw Error("Cannot reply, missing requirement: tweetId")
        }

        if (!username) {
            throw Error("Cannot reply, missing requirement: username")
        }

        const getTweetResp = await tweetsModel.get(tweetId)

        const originalTweet = getTweetResp.Item

        if (!originalTweet) {
            throw Error('Original tweet not found.')
        }

        const id = ulid.ulid();
        const timestamp = new Date().toJSON();
        const hashtags = extractHashtags(text);

        const inReplyToUserIds = await buildReplyUsersList(originalTweet, tweetsModel);

        let newTweet = {
            __typename: TweetTypes.REPLY,
            id,
            author: username,
            createdAt: timestamp,
            text,
            replies: 0,
            likes: 0,
            retweets: 0,
            inReplyToTweetId: tweetId,
            inReplyToUserIds: [...inReplyToUserIds]
        }

        if (hashtags) {
            newTweet = Object.assign({}, newTweet, { hashtags })
        }

        const newTimeline = {
            userId: username,
            tweetId: id,
            timestamp,
            inReplyToTweetId: originalTweet.id
        }

        const transactItems = [
            {
                Put: {
                    TableName: TWEETS_TABLE,
                    Item: newTweet
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
                    UpdateExpression: 'ADD replies :incr',
                    ExpressionAttributeValues: {
                        ":incr": 1
                    },
                    ConditionExpression: "attribute_exists(id)"
                }
            },
            {
                Put: {
                    TableName: TIMELINES_TABLE,
                    Item: newTimeline
                }
            }
        ]

        const input = {
            TransactItems: transactItems
        };
        await tweetsModel.transactWrite(input);
        return newTweet;
    } catch (err) {
        console.error("Err [reply] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

async function buildReplyUsersList(tweet, tweetModel) {
    try {
        const usersSet = new Set()

        const tweetType = tweet.Item ? tweet.Item.__typename : tweet.__typename

        switch (tweetType) {
            case TweetTypes.TWEET:
                usersSet.add(tweet.author);
                return usersSet
            case TweetTypes.REPLY:
                tweet.inReplyToUserIds.every(u => usersSet.add(u));
                usersSet.add(tweet.author);
                return usersSet
            case TweetTypes.RETWEET:
                usersSet.add(tweet.author);
                const getRetweetOrigin = await tweetModel.get(tweet.retweetOf);
                const originalTweet = getRetweetOrigin.Item
                if (!originalTweet) {
                    throw Error('Original tweet not found.')
                }
                const retweetUsers = [...await buildReplyUsersList(originalTweet, tweetModel)];
                retweetUsers.every(u => usersSet.add(u));
                return usersSet
            default:
                console.info("[buildReplyUsersList] tweet :", tweet)
                throw new Error('Unrecognised Tweet type!')
        }
    } catch (caught) {
        console.error("Err [buildReplyUsersList] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}