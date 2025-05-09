const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance()

require("dotenv").config()

describe("Given an authenticated user, when they send a tweet", () => {
    let user;
    let tweet;
    let userB;
    let tweetB;
    const text = chance.string({ length: 16 });
    const textB = chance.string({ length: 16 });

    beforeAll(async () => {
        user = await given.authenticated_user()

        userB = await given.authenticated_user()

        if (user && user.username) {
            tweet = await when.user_calls_tweet(user, text);
        }

        if (userB && userB.username) {
            tweetB = await when.user_calls_tweet(userB, textB);
        }
    })


    it("Should return new tweet", async () => {
        // For random or Date properties, which are harder to test by value
        expect(tweet).toHaveProperty('id', 'createdAt', 'profile.screenName', 'profile.createdAt')

        expect(tweet).toMatchObject({
            text,
            replies: 0,
            likes: 0,
            retweets: 0,
            liked: false,
            retweeted: false,
            profile: {
                id: user.username,
                name: user.name,
                imgUrl: null,
                bgImgUrl: null,
                bio: null,
                location: null,
                website: null,
                birthdate: null,
                followersCount: 0,
                followingCount: 0,
                tweetsCount: 1,
                likesCount: 0
            }
        })
    })

    describe("When user calls getTweets", () => {
        let tweets;
        let nextToken;
        beforeAll(async () => {
            const result = await when.user_calls_getTweets({ user, limit: 10 })
            tweets = result.tweets
            nextToken = result.nextToken
        })
        it("Should see the new tweet when calling getTweets", () => {
            expect(nextToken).toBeFalsy()
            expect(tweets.length).toEqual(1)
            expect(tweets[0]).toMatchObject(tweet)
        })

        it("Cannot ask more than 25 tweets", async () => {
            await expect(when.user_calls_getTweets({ user, limit: 26 })).rejects.toMatchObject({
                message: expect.stringContaining("Error: Max limit cannot be greater 25")
            })
        })
    })

    describe("When user calls getMyTimeline", () => {
        let tweets;
        let nextToken;
        beforeAll(async () => {
            const result = await when.user_calls_getMyTimeline({ user, limit: 10 })
            tweets = result.tweets
            nextToken = result.nextToken
        })
        it("Should see new tweet in timeline when calling getMyTimeline", () => {
            expect(nextToken).toBeFalsy()
            expect(tweets.length).toEqual(1)
            expect(tweets[0]).toMatchObject(tweet)
        })

        it("Cannot ask more than 25 tweets per timeline", async () => {
            await expect(when.user_calls_getMyTimeline({ user, limit: 26 })).rejects.toMatchObject({
                message: expect.stringContaining("Error: Max limit cannot be greater 25")
            })
        })
    })

    describe("When user calls like", () => {
        beforeAll(async () => {
            await when.user_calls_like({ user, tweetId: tweet.id })
        })
        it("Should be able to like the tweet", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })
            const likedTweet = timeline.tweets[0]
            expect(likedTweet).toMatchObject({
                liked: true
            })
        })

        it("Should not be able to like twice", async () => {
            await expect(when.user_calls_like({ user, tweetId: tweet.id })).rejects.toMatchObject({
                message: expect.stringContaining("Error with DynamoDB transaction")
            })
        })
    })

    describe("When user calls getLikes", () => {
        let getLikesResponse;
        beforeAll(async () => {
            getLikesResponse = await when.user_calls_getLikes({ user, limit: 10 })
        })
        it("Should get list of likes", async () => {
            const { nextToken, tweets } = getLikesResponse
            expect(nextToken).toBe(null)
            expect(tweets.length).toBe(1);
            expect(tweets[0]).toMatchObject({
                ...tweet,
                profile: {
                    likesCount: 1
                },
                likes: 1,
                liked: true
            })
        })

        it("Cannot ask more than 25 likes", async () => {
            await expect(when.user_calls_getLikes({ user, limit: 26 })).rejects.toMatchObject({
                message: expect.stringContaining("Error: Max limit cannot be greater 25")
            })
        })
    })

    describe("When user calls unlike", () => {
        beforeAll(async () => {
            await when.user_calls_unlike({ user, tweetId: tweet.id })
        })
        it("Should be able to unlike the tweet", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })
            const likedTweet = timeline.tweets[0]
            expect(likedTweet).toMatchObject({
                liked: false
            })
        })

        it("Should not be able to like twice", async () => {
            await expect(when.user_calls_unlike({ user, tweetId: tweet.id })).rejects.toMatchObject({
                message: expect.stringContaining("Error with DynamoDB transaction")
            })
        })
    })

    describe("When user calls getLikes", () => {
        let getLikesResponse;
        beforeAll(async () => {
            getLikesResponse = await when.user_calls_getLikes({ user, limit: 10 })
        })
        it("Should get empty list of likes - no likes available", async () => {
            const { nextToken, tweets } = getLikesResponse
            expect(nextToken).toBe(null)
            expect(tweets.length).toBe(0);
        })
    })

    describe("When user calls retweet with their own tweet", () => {
        beforeAll(async () => {
            await when.user_calls_retweet({ user, tweetId: tweet.id })
        })
        it("Should update tweets", async () => {
            const { tweets } = await when.user_calls_getTweets({ user, limit: 10 })

            expect(tweets.length).toBe(2)
            expect(tweets[0]).toMatchObject({
                profile: {
                    id: user.username,
                    name: user.name,
                    tweetsCount: 2
                },
                retweetOf: {
                    ...tweet,
                    retweets: 1,
                    retweeted: true,
                    profile: {
                        id: user.username,
                        tweetsCount: 2
                    }
                }
            })

            expect(tweets[1]).toMatchObject({
                ...tweet,
                retweets: 1,
                retweeted: true,
                profile: {
                    id: user.username,
                    tweetsCount: 2
                }
            })

        })

        it("Should no see own retweet in timeline", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })
            expect(timeline.tweets).toHaveLength(1);
        })
    })

    describe("When user calls retweet with another tweet", () => {
        beforeAll(async () => {
            await when.user_calls_retweet({ user, tweetId: tweetB.id })
        })
        it("Should update tweets", async () => {
            const { tweets } = await when.user_calls_getTweets({ user, limit: 10 })

            expect(tweets.length).toBe(3)
            expect(tweets[0]).toMatchObject({
                profile: {
                    id: user.username,
                    name: user.name,
                    tweetsCount: 3
                },
                retweetOf: {
                    ...tweetB,
                    retweets: 1,
                    retweeted: true,
                    profile: {
                        id: userB.username,
                        tweetsCount: 1
                    }
                }
            })
        })

        it("Should see retweet in timeline", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })
            expect(timeline.tweets).toHaveLength(2);

            expect(timeline.tweets[0]).toMatchObject({
                profile: {
                    id: user.username,
                    tweetsCount: 3
                },
                retweetOf: {
                    ...tweetB,
                    retweets: 1,
                    retweeted: true,
                    profile: {
                        id: userB.username,
                        tweetsCount: 1
                    }
                }
            })
        })
    })

    describe("When user calls unretweet on their own tweet", () => {
        beforeAll(async () => {
            await when.user_calls_unretweet({ user, tweetId: tweet.id })
        })
        it("Should update tweets", async () => {
            const { tweets } = await when.user_calls_getTweets({ user, limit: 10 })

            expect(tweets.length).toBe(2)

            // User: last tweet was another retweet from UserB
            expect(tweets[0]).toMatchObject({
                profile: {
                    id: user.username,
                    name: user.name,
                    tweetsCount: 2
                },
                retweetOf: {
                    ...tweetB,
                    retweets: 1,
                    retweeted: true,
                    profile: {
                        id: userB.username,
                        tweetsCount: 1
                    }
                }
            })

            // User: own tweet is no longer retweeted
            expect(tweets[1]).toMatchObject({
                ...tweet,
                retweets: 0,
                retweeted: false,
                profile: {
                    id: user.username,
                    tweetsCount: 2
                }
            })
        })

        it("Should not see own retweet in timeline", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })

            // User: their own tweet, the retweet from another user
            expect(timeline.tweets).toHaveLength(2);

            expect(timeline.tweets[0]).toMatchObject({
                profile: {
                    id: user.username,
                    tweetsCount: 2
                },
                retweetOf: {
                    ...tweetB,
                    retweets: 1,
                    retweeted: true,
                    profile: {
                        id: userB.username,
                        tweetsCount: 1
                    }
                }
            })

            expect(timeline.tweets[1]).toMatchObject({
                ...tweet,
                retweets: 0,
                retweeted: false,
                profile: {
                    id: user.username,
                    tweetsCount: 2
                }
            })
        })
    })
    describe("When user calls unretweet with another tweet", () => {
        beforeAll(async () => {
            await when.user_calls_unretweet({ user, tweetId: tweetB.id })
        })
        it("Should update tweets", async () => {
            const { tweets } = await when.user_calls_getTweets({ user, limit: 10 })

            expect(tweets.length).toBe(1)

            // User: only has their own tweet now
            expect(tweets[0]).toMatchObject({
                ...tweet,
                retweets: 0,
                retweeted: false,
                profile: {
                    id: user.username,
                    tweetsCount: 1
                }
            })
        })

        it("Should see retweet in timeline", async () => {
            const timeline = await when.user_calls_getMyTimeline({ user, limit: 10 })
            expect(timeline.tweets).toHaveLength(1);

            expect(timeline.tweets[0]).toMatchObject({
                ...tweet,
                retweets: 0,
                retweeted: false,
                profile: {
                    id: user.username,
                    tweetsCount: 1
                }
            })
        })
    })
})