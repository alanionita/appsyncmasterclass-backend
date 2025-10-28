const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance()
const retry = require('async-retry');
const { GraplQLClient } = require('../../lib/appsyncClient');
const { waitSec } = require("../../lib/utils");

require("dotenv").config()

const { APPSYNC_HTTP_URL, REGION } = process.env

describe("Given 2 authenticated users, ", () => {
    let userA;
    let userB;
    let userATweet;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            const tweetText = chance.string({ length: 16 });
            userATweet = await when.user_calls_tweet(userA, tweetText);
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

                    subscription.unsubscribe();

                    expect(subscription.closed).toBe(true)
                }, {
                    retries: 10,
                    maxTimeout: 1000
                })

            }, 15 * 1000)
        })

    })
}, 15 * 1000)