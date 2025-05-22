const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance();
const retry = require('async-retry');

require("dotenv").config()

describe("Given 2 authenticated users", () => {
    let userA;
    let userB;
    let userAProfile;
    let userBProfile;
    let userBTweet1;
    let userBTweet2;


    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            userAProfile = await when.user_calls_getMyProfile(userA);
        }
        if (userB && userB.username) {
            userBProfile = await when.user_calls_getMyProfile(userB);
            // send tweets
            userBTweet1 = await when.user_calls_tweet(userB, chance.string({ length: 16 }));
            userBTweet2 = await when.user_calls_tweet(userB, chance.string({ length: 16 }));
        }

    })
    describe('When userA follows userB', () => {
        beforeAll(async () => {
            await when.user_calls_follow({
                user: userA,
                userId: userB.username
            });
        })

        it("UserA should see following for UserB", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userA, screenName: userBProfile.screenName
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(false);
        })
        it("UserA should see tweets for UserB", async () => {
            await retry(async () => {
                const { tweets, nextToken } = await when.user_calls_getMyTimeline({ user: userA, limit: 10 })
                expect(nextToken).toBeFalsy()
                expect(tweets.length).toEqual(2)
                expect(tweets).toEqual([
                    expect.objectContaining({
                        id: userBTweet2.id
                    }),
                    expect.objectContaining({
                        id: userBTweet1.id
                    })
                ])
            }, {
                retries: 3,
                maxTimeout: 1000
            })


        })
        it("UserB should see followedBy for UserA", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userB, screenName: userAProfile.screenName
            })
            expect(following).toBe(false);
            expect(followedBy).toBe(true);
        })

        describe('When UserB tweets, ', () => {
            const text = chance.string({ length: 16 });
            let userBtweet;

            beforeEach(async () => {
                userBtweet = await when.user_calls_tweet(userB, text);
            })

            it("UserA timeline should contain new tweet", async () => {
                await retry(async () => {
                    const { tweets, nextToken } = await when.user_calls_getMyTimeline({ user: userA, limit: 10 })
                    expect(nextToken).toBeFalsy()
                    expect(tweets.length).toEqual(3)
                    expect(tweets[0]).toMatchObject(userBtweet)
                }, {
                    retries: 3,
                    maxTimeout: 1000
                })
            })
        })
    })
    describe('When userB follows userA', () => {
        beforeAll(async () => {
            await when.user_calls_follow({
                user: userB,
                userId: userA.username
            });
        })

        it("UserA should see following and followedBy for UserB", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userB, screenName: userAProfile.screenName
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(true);
        })
        it("UserB should see followedBy and following for UserA", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userA, screenName: userBProfile.screenName
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(true);
        })
        describe('When UserA tweets, ', () => {
            const text = chance.string({ length: 16 });
            let userAtweet;

            beforeEach(async () => {
                userAtweet = await when.user_calls_tweet(userA, text);
            })

            it("UserB timeline should contain new tweet", async () => {
                await retry(async () => {
                    const { tweets, nextToken } = await when.user_calls_getMyTimeline({ user: userA, limit: 10 })
                    expect(nextToken).toBeFalsy()
                    expect(tweets.length).toEqual(4)
                    expect(tweets[0]).toMatchObject(userAtweet)
                }, {
                    retries: 3,
                    maxTimeout: 1000
                })
            })
        })
    })
})
