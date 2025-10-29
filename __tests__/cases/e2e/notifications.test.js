const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance()
const retry = require('async-retry');
const { GraplQLClient } = require('../../lib/appsyncClient');
const { waitSec, datePattern } = require("../../lib/utils");

require("dotenv").config()

const { APPSYNC_HTTP_URL, REGION } = process.env

describe("Given 2 authenticated users, ", () => {
    let userA;
    let userB;
    let userATweet;
    let userAProfile;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            const tweetText = chance.string({ length: 16 });
            userATweet = await when.user_calls_tweet(userA, tweetText);

            userAProfile = await when.user_calls_getMyProfile(userA)
        }
    })
    describe('When userA subscribes to notifications', () => {
        let subscription;
        let appsyncClient;
        const notifications = []
        beforeAll(async () => {
            appsyncClient = new GraplQLClient({
                region: REGION,
                appSyncUrl: APPSYNC_HTTP_URL,
                accessToken: userA.accessToken
            })

            const onNotifiedVars = {
                userId: userA.username
            }

            const observable = await appsyncClient.onNotified(onNotifiedVars);
            subscription = observable.subscribe({
                next(resp) {
                    if (resp && resp.data) {
                        const { onNotified } = resp.data;
                        notifications.push(onNotified);
                    }
                },
                error(error) {
                    console.error('Subscription error:', error);
                },
                complete() {
                    console.info('Subscription completed');
                }
            });
        })

        describe("When userB retweets userATweet", () => {
            let userBRetweet;
            beforeAll(async () => {
                userBRetweet = await when.user_calls_retweet({
                    user: userB,
                    tweetId: userATweet.id
                })
            })
            it("userA should get a Retweeted notification", async () => {
                await retry(async () => {
                    expect(subscription).toBeDefined();
                    expect(subscription.closed).toBe(false);
                    expect(notifications).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                type: 'Retweeted',
                                userId: userA.username,
                                tweetId: userATweet.id,
                                retweetId: userBRetweet.id,
                                retweetedBy: userB.username
                            })
                        ])
                    )
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 15 * 1000)
        })

        describe("When userB likes userATweet", () => {
            beforeAll(async () => {
                await when.user_calls_like({
                    user: userB,
                    tweetId: userATweet.id
                })
            })
            it("userA should get a Liked notification", async () => {
                await retry(async () => {
                    expect(subscription).toBeDefined();
                    expect(subscription.closed).toBe(false);
                    expect(notifications).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                type: 'Liked',
                                userId: userA.username,
                                tweetId: userATweet.id,
                                likedBy: userB.username
                            })
                        ])
                    )
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 15 * 1000)
        })

        describe("When userB replies to userATweet", () => {
            let userBReply;
            const replyText = chance.string({ length: 16 });

            beforeAll(async () => {
                userBReply = await when.user_calls_reply({
                    user: userB,
                    tweetId: userATweet.id,
                    text: replyText
                })
            })
            it("userA should get a Replied notification", async () => {
                await retry(async () => {
                    expect(subscription).toBeDefined();
                    expect(subscription.closed).toBe(false);
                    expect(notifications).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                type: 'Replied',
                                userId: userA.username,
                                tweetId: userATweet.id,
                                replyTweetId: userBReply.id,
                                repliedBy: userB.username
                            })
                        ])
                    )
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 15 * 1000)
        })

        describe("When userB mentions userA", () => {
            let userBTweet;

            beforeAll(async () => {
                const tweetMention = chance.string({ length: 16 }) + ` @${userAProfile.screenName}`;
                userBTweet = await when.user_calls_tweet(userB, tweetMention)
            })
            it("userA should get a Mentioned notification", async () => {
                await retry(async () => {
                    expect(subscription).toBeDefined();
                    expect(subscription.closed).toBe(false);
                    expect(notifications).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                type: 'Mentioned',
                                userId: userA.username,
                                mentionedByTweetId: userBTweet.id,
                                mentionedBy: userB.username
                            })
                        ])
                    )
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 15 * 1000)
        })

        describe("When userB sends a direct message to userA", () => {
            let conversation;
            const dmText = chance.string({ length: 16 })

            beforeAll(async () => {
                let appsyncClientB = new GraplQLClient({
                    region: REGION,
                    appSyncUrl: APPSYNC_HTTP_URL,
                    accessToken: userB.accessToken
                })

                const vars = {
                    otherUserId: userA.username,
                    message: dmText
                }

                conversation = await appsyncClientB.sendDirectMessage(vars);

            })
            it("userA should get a DMed notification", async () => {
                await retry(async () => {
                    expect(subscription).toBeDefined();
                    expect(subscription.closed).toBe(false);
                    expect(notifications).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                id: expect.any(String),
                                type: 'DMed',
                                userId: userA.username,
                                otherUserId: userB.username,
                                message: conversation.lastMessage,
                                createdAt: expect.stringMatching(datePattern)
                            })
                        ])
                    )

                    subscription.unsubscribe();

                    expect(subscription.closed).toBe(true)
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 20 * 1000)
        })

    })
}, 15 * 1000)