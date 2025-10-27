import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";
import ddb from "../lib/dynamodb.js";
import { GraplQLClient } from "../lib/graphql.mjs";
import { extractMentions } from "../lib/utils.js";
const { REGION, TWEETS_TABLE, APPSYNC_URL, USERS_TABLE } = process.env;

const TweetTypes = {
    TWEET: 'Tweet',
    RETWEET: 'Retweet',
    REPLY: 'Reply'
}

export async function handler(event) {
    try {
        if (!TWEETS_TABLE || !REGION || !APPSYNC_URL || !USERS_TABLE) {
            throw Error("Missing environment variables")
        }
        const tweetsModel = new ddb({ region: REGION, tableName: TWEETS_TABLE });
        const appsyncClient = new GraplQLClient({ region: REGION, appSyncUrl: APPSYNC_URL })

        for (let record of event.Records) {
            if (record.eventName == 'INSERT') {
                const tweet = unmarshall(record.dynamodb.NewImage);
                const { __typename, text } = tweet;

                if (!__typename && !text) {
                    throw Error("Malformed tweet")
                }

                switch (__typename) {
                    case TweetTypes.RETWEET:
                        if (!tweet.retweetOf) {
                            throw Error("Malformed retweet")
                        }
                        const retweetOf = await tweetsModel.getItem(tweet.retweetOf);
                        const variables = {
                            id: ulid(),
                            userId: retweetOf.author,
                            tweetId: retweetOf.id,
                            retweetId: tweet.id,
                            retweetedBy: tweet.author
                        }
                        await appsyncClient.notifyRetweeted(variables)
                        break;
                    case TweetTypes.REPLY:
                    case TweetTypes.TWEET:
                        // Handle mentions 
                        if (text) {
                            const mentionedUsers = await fetchUserIds(text)
                            if (mentionedUsers && mentionedUsers.length > 0) {
                                const mentionedRequests = mentionedUsers.map(async mentionedUserId => {
                                    const variables = {
                                        id: ulid(),
                                        userId: mentionedUserId,
                                        mentionedBy: tweet.author,
                                        mentionedByTweetId: tweet.id,
                                    }
                                    await appsyncClient.notifyMentioned(variables)
                                })

                                await Promise.all(mentionedRequests)
                                break;
                            }
                            break;
                        }

                }

            }
        }
    } catch (err) {
        console.error("Err [notify] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

async function fetchUserIds(text) {
    try {
        const mentions = extractMentions(text);
        const screenNames = mentions.map(mention => mention.replace('@', ''));

        if (!screenNames && screenNames.length < 1) {
            return null
        }

        const usersModel = new ddb({ region: REGION, tableName: USERS_TABLE })

        const userRequests = screenNames.map(async screenName => {
            const input = {
                TableName: USERS_TABLE,
                IndexName: 'byScreenName',
                KeyConditionExpression: "screenName = :screenName",
                Limit: 1,
                ExpressionAttributeValues: {
                    ":screenName": screenName,
                }
            };

            return await usersModel.query(input);
        })

        const users = await Promise.all(userRequests)

        if (users) {
            const usersIds = users.map((user) => {
                if (user.Count > 0 && user.Items) {
                    const userObj = user.Items[0];
                    return userObj.id;
                }
            })
            return usersIds;
        }
        
    } catch (err) {
        console.error("Err [notify/fetchUserIds] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
}