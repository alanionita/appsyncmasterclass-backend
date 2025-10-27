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
                const { __typename } = tweet;

                if (!__typename) {
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
                    case TweetTypes.TWEET:
                        await notifyMentioned(appsyncClient, tweet);
                        break;
                    case TweetTypes.REPLY:
                        await notifyMentioned(appsyncClient, tweet);
                        break;
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

        if (!mentions && mentions.length < 1) {
            return null
        }

        const screenNames = mentions.map(mention => mention.replace('@', ''));

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


/**
 * Triggers notifications for Tweet/Reply mentions
 * @param {GraplQLClient} appsync - appsync client, used by notification calls
 * @param {Tweet | Reply} tweet - the tweet text
 * @returns {Void} side-effect notifications call via Appsync api
 * @throws {Error} Either with custom payloads or GraphQL errors
 */

async function notifyMentioned(appsync, { text, author, id }) {
    try {
        if (!text && !author && !id) {
            throw Error("Malformed tweet")
        }
        if(!appsync) {
            throw Error("Missing required Appsync client")
        }
        const mentionedUsers = await fetchUserIds(text)
        if (mentionedUsers && mentionedUsers.length > 0) {
            const mentionedRequests = mentionedUsers.map(async mentionedUserId => {
                const variables = {
                    id: ulid(),
                    userId: mentionedUserId,
                    mentionedBy: author,
                    mentionedByTweetId: id,
                }
                return await appsync.notifyMentioned(variables)
            })

            await Promise.all(mentionedRequests);
            return;
        }
        return;
    } catch (err) {
        console.error("Err [notify/notifyMentioned] ::", err.message)
        console.info(JSON.stringify(err.stack))
        return err
    }
}