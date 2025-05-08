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
        const userBReplyText = chance.string({ length: 16 });
        beforeAll(async () => {
            await when.user_calls_reply({
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
    })
})