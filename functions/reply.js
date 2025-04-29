const ulid = require("ulid");
const { TweetTypes } = require("../lib/constants");
const ddbLib = require("../lib/dynamodb");
const { USERS_TABLE, REGION, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env;

module.exports.handler = async (event) => {
    try {
        if (!USERS_TABLE || !TWEETS_TABLE || !TIMELINES_TABLE || !REGION || !RETWEETS_TABLE) {
            throw Error("Missing environment variables")
        }
        const tweetsModel = new ddbLib({ region: REGION, tableName: TWEETS_TABLE })

        const { tweetId, text } = event.arguments;
        const { username } = event.identity;

        if (!tweetId || !username) {
            throw Error("Cannot retweet, missing requirements [tweetId, username]")
        }

        const getTweetResp = await tweetsModel.get(tweetId)

        const originalTweet = getTweetResp.Item

        if (!originalTweet) {
            throw Error('Original tweet not found.')
        }

        const id = ulid.ulid();
        const timestamp = new Date().toJSON();

        const newTweet = {
            __typename: TweetTypes.REPLY,
            id,
            author: username,
            createdAt: timestamp,
            text,
            replies: 0,
            likes: 0,
            retweets: 0,
            inReplyToTweet: tweetId,
            inReplyToUsers: [...buildReplyUsersList(originalTweet, tweetsModel)]
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
        return true;
    } catch (err) {
        console.error("Err [reply] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

function buildReplyUsersList(tweet, tweetModel) {
    try {
        const usersSet = new Set()

        switch (tweet.__typename) {
            case TweetTypes.TWEET:
                usersSet.add(tweet.author);
                return usersSet
            case TweetTypes.REPLY:
                tweet.inReplyToUsers.every(u => usersSet.add(u));
                usersSet.add(tweet.author);
                return usersSet
            case TweetTypes.RETWEET:
                usersSet.add(tweet.author);    
                const retweetOfItem = tweetModel.get(retweetOf);
                const retweetUsers = buildReplyUsersList(retweetOfItem);
                retweetUsers.every(u => usersSet.add(u));
                return usersSet
            default:
                throw new Error('Unrecognised Tweet type!')
        }
    } catch (caught) {
        console.error("Err [buildReplyUsersList] ::", caught.message)
        console.info(JSON.stringify(caught.stack))
        return caught
    }
}