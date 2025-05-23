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

        it("UserA gets UserB's profile, should see following, followedBy", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userA, screenName: userBProfile.screenName
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(false);
        })

        it("UserA gets UserB.followers, should see UserA in list", async () => {
            const { profiles } = await when.user_calls_getFollowers({
                user: userA, 
                userId: userB.username,
                limit: 25
            })
            expect(profiles.length).toBe(1);
            expect(profiles[0].following).toBeUndefined();
            expect(profiles[0].followedBy).toBeUndefined();
            expect(profiles[0]).toMatchObject({
                id: userA.username
            });
        })

        it("UserA gets UserB.following, should see empty list", async () => {
            const { profiles } = await when.user_calls_getFollowing({
                user: userA, 
                userId: userB.username,
                limit: 25
            })
            expect(profiles.length).toBe(0);
        })

        it("UserB gets UserB.followers, should see UserA in list", async () => {
            const { profiles } = await when.user_calls_getFollowers({
                user: userB,
                userId: userB.username,
                limit: 25
            })
            expect(profiles.length).toBe(1);
            expect(profiles[0]).toMatchObject({
                id: userA.username
            });
            expect(profiles[0].following).toBe(false);
            expect(profiles[0].followedBy).toBe(true);
        })

        it("UserB gets UserB.following, should see empty list", async () => {
            const { profiles } = await when.user_calls_getFollowing({
                user: userB, 
                userId: userB.username,
                limit: 25
            })
            expect(profiles.length).toBe(0);
        })

        it("UserA timeline has UserB tweets", async () => {
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
        it("UserB gets UserA profile, should see followed, followedBy", async () => {
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

            it("UserA timeline should contain new tweet from UserB", async () => {
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
    describe('When userA unfollows userB', () => {
        beforeAll(async () => {
            await when.user_calls_unfollow({
                user: userA,
                userId: userB.username
            });
        })

        it("UserA should not see following for UserB", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userA, screenName: userBProfile.screenName
            })
            expect(following).toBe(false);
            expect(followedBy).toBe(true);
        })
        
        it("UserB should not see followedBy for UserA", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({
                user: userB, screenName: userAProfile.screenName
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(false);
        })

        it("UserA should not see tweets for UserB", async () => {
            await retry(async () => {
                const { tweets, nextToken } = await when.user_calls_getMyTimeline({ user: userA, limit: 10 })
                expect(nextToken).toBeFalsy()
                expect(tweets.length).toEqual(1)
                // Only tweet left is one sent by UserA
                expect(tweets[0].profile.id).toEqual(userA.username)
            }, {
                retries: 3,
                maxTimeout: 1000
            })
        })
    })
})
