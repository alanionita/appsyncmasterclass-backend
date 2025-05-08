const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance()

require("dotenv").config()

describe("Given an authenticated user, when they send a tweet", () => {
    let userA;
    let userB;
    let userC;
    let userATweet;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()
        userC = await given.authenticated_user()

        if (userA && userA.username) {
            const userAtweetText = chance.string({ length: 16 });
            userATweet = await when.user_calls_tweet(userA, userAtweetText);
        }
    })
    describe('When userB replies to userA tweet', () => {
        let userBReply;
        const userBReplyText = chance.string({ length: 16 });
        beforeAll(async () => {
            userBReply = await when.user_calls_reply({
                user: userB,
                tweetId: userATweet.id,
                text: userBReplyText
            });
        })

        it("UserB should see the new tweet when calling getTweets", async () => {
            const { tweets, nextToken } = await when.user_calls_getTweets({ user: userB, limit: 10 })
            expect(nextToken).toBeFalsy()
            expect(tweets.length).toEqual(1)
            const targetTweet = tweets[0];
            expect(targetTweet).toMatchObject({
                text: userBReplyText,
                replies: 0,
                likes: 0,
                retweets: 0,
                liked: false,
                retweeted: false,
                profile: {
                    id: userB.username,
                    name: userB.name,
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
                },
                inReplyToTweet: {
                    id: userATweet.id,
                    replies: 1,
                    liked: false,
                    retweeted: false
                },
                inReplyToUsers: [{
                    id: userA.username
                }]
            })
        })
        it("UserB should see new tweet in timeline when calling getMyTimeline", async () => {
            const { tweets } = await when.user_calls_getMyTimeline({ user: userB, limit: 10 })
            expect(tweets.length).toEqual(1)
            expect(tweets[0]).toMatchObject({
                text: userBReplyText,
                replies: 0,
                likes: 0,
                retweets: 0,
                liked: false,
                retweeted: false,
                profile: {
                    id: userB.username,
                    name: userB.name,
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
                },
                inReplyToTweet: {
                    id: userATweet.id,
                    replies: 1,
                    liked: false,
                    retweeted: false
                },
                inReplyToUsers: [{
                    id: userA.username
                }]
            })
        })
        describe('When userC replies to userB reply', () => {
            let userCReply;
            const userCReplyText = chance.string({ length: 16 });
            beforeAll(async () => {
                await when.user_calls_reply({
                    user: userC,
                    tweetId: userBReply.id,
                    text: userCReplyText
                });
            })

            it("UserC should see the new tweet when calling getTweets", async () => {
                const { tweets, nextToken } = await when.user_calls_getTweets({ user: userC, limit: 10 })
                expect(nextToken).toBeFalsy()
                expect(tweets.length).toEqual(1)

                const targetTweet = tweets[0];
                
                expect(targetTweet).toMatchObject({
                    text: userCReplyText,
                    replies: 0,
                    likes: 0,
                    retweets: 0,
                    liked: false,
                    retweeted: false,
                    profile: {
                        id: userC.username,
                        name: userC.name,
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
                    },
                    inReplyToTweet: {
                        id: userBReply.id,
                        replies: 1,
                        liked: false,
                        retweeted: false
                    },
                    inReplyToUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: userA.username
                        })
                        ,
                        expect.objectContaining({
                            id: userB.username
                        })
                    ])
                })
                expect(targetTweet.inReplyToUsers.length).toBe(2)
            })
            it("UserC should see new tweet in timeline when calling getMyTimeline", async () => {
                const { tweets } = await when.user_calls_getMyTimeline({ user: userC, limit: 10 })
                expect(tweets.length).toEqual(1)

                const targetTweet = tweets[0];

                expect(targetTweet).toMatchObject({
                    text: userCReplyText,
                    replies: 0,
                    likes: 0,
                    retweets: 0,
                    liked: false,
                    retweeted: false,
                    profile: {
                        id: userC.username,
                        name: userC.name,
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
                    },
                    inReplyToTweet: {
                        id: userBReply.id,
                        replies: 1,
                        liked: false,
                        retweeted: false
                    },
                    inReplyToUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: userA.username
                        })
                        ,
                        expect.objectContaining({
                            id: userB.username
                        })
                    ])
                })
                expect(targetTweet.inReplyToUsers.length).toBe(2)
            })
        })
    })

})