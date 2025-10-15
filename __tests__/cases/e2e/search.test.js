const given = require("../../steps/given");
const when = require("../../steps/when");
const retry = require('async-retry');
const chance = require('chance').Chance()
const { SearchMode } = require('../../../lib/constants')

require("dotenv").config()

describe("Given an authenticated user, when they send a tweet", () => {
    let userA;
    let userATweet;
    let userAProfile;
    let userABio = "Test suit bio, " + chance.string({ length: 8 });

    beforeAll(async () => {
        userA = await given.authenticated_user()

        if (userA && userA.username) {
            const userAtweetText = chance.string({ length: 16 });
            userATweet = await when.user_calls_tweet(userA, userAtweetText);

            const userAProfileEdited = {
                name: userA.name,
                bio: userABio
            }

            await when.user_calls_editMyProfile(userA, userAProfileEdited);

            userAProfile = await when.user_calls_getMyProfile(userA);
        }
    })

    describe('When userA searches for their user name, ', () => {
        it('Should return their profile', async () => {
            await retry(async () => {
                const returnProfile = await when.user_calls_search({
                    user: userA,
                    query: userA.name,
                    mode: SearchMode.people,
                    limit: 10
                })

                expect(returnProfile.results).toBeTruthy();
                expect(returnProfile.nextToken).toBeFalsy();
                expect(returnProfile.results[0]).toMatchObject({
                    id: userAProfile.id,
                    name: userAProfile.name,
                    screenName: userAProfile.screenName,
                    imgUrl: userAProfile.imgUrl,
                    bgImgUrl: userAProfile.bgImgUrl,
                    bio: userAProfile.bio,
                    location: userAProfile.location,
                    website: userAProfile.website,
                    birthdate: userAProfile.birthdate,
                    createdAt: userAProfile.createdAt,
                    followersCount: userAProfile.followersCount,
                    followingCount: userAProfile.followingCount,
                    tweetsCount: userAProfile.tweetsCount,
                    likesCount: userAProfile.likesCount,
                })
            }, {
                retries: 3,
                maxTimeout: 1000

            })
        })
    })
    describe('When userA searches for their user screenName, ', () => {
        it('Should return their profile', async () => {
            await retry(async () => {
                const returnProfile = await when.user_calls_search({
                    user: userA,
                    query: userAProfile.screenName,
                    mode: SearchMode.people,
                    limit: 10
                })

                expect(returnProfile.results).toBeTruthy();
                expect(returnProfile.nextToken).toBeFalsy();
                expect(returnProfile.results[0]).toMatchObject({
                    id: userAProfile.id,
                    name: userAProfile.name,
                    screenName: userAProfile.screenName,
                    imgUrl: userAProfile.imgUrl,
                    bgImgUrl: userAProfile.bgImgUrl,
                    bio: userAProfile.bio,
                    location: userAProfile.location,
                    website: userAProfile.website,
                    birthdate: userAProfile.birthdate,
                    createdAt: userAProfile.createdAt,
                    followersCount: userAProfile.followersCount,
                    followingCount: userAProfile.followingCount,
                    tweetsCount: userAProfile.tweetsCount,
                    likesCount: userAProfile.likesCount,
                })
            }, {
                retries: 3,
                maxTimeout: 1000

            })
        })
    })
    describe('When userA searches for their user bio, ', () => {
        it('Should return their profile', async () => {
            await retry(async () => {
                const returnProfile = await when.user_calls_search({
                    user: userA,
                    query: userABio,
                    mode: SearchMode.people,
                    limit: 10
                })

                expect(returnProfile.results).toBeTruthy();
                expect(returnProfile.nextToken).toBeFalsy();
                expect(returnProfile.results[0]).toMatchObject({
                    id: userAProfile.id,
                    name: userAProfile.name,
                    screenName: userAProfile.screenName,
                    imgUrl: userAProfile.imgUrl,
                    bgImgUrl: userAProfile.bgImgUrl,
                    bio: userAProfile.bio,
                    location: userAProfile.location,
                    website: userAProfile.website,
                    birthdate: userAProfile.birthdate,
                    createdAt: userAProfile.createdAt,
                    followersCount: userAProfile.followersCount,
                    followingCount: userAProfile.followingCount,
                    tweetsCount: userAProfile.tweetsCount,
                    likesCount: userAProfile.likesCount,
                })
            }, {
                retries: 3,
                maxTimeout: 1000

            })
        })
    })
    describe('When userA searches for their tweet, ', () => {
        it('Should return their tweet', async () => {
            await retry(async () => {
                const returnTweet = await when.user_calls_search({
                    user: userA,
                    query: userATweet.text,
                    mode: SearchMode.latest,
                    limit: 10
                })

                expect(returnTweet.results).toBeTruthy();
                expect(returnTweet.nextToken).toBeFalsy();
                expect(returnTweet.results[0]).toMatchObject({
                    __typename: "Tweet",
                    id: userATweet.id,
                    profile: expect.objectContaining({
                        id: userAProfile.id,
                        name: userAProfile.name,
                        screenName: userAProfile.screenName,
                        imgUrl: userAProfile.imgUrl,
                        bgImgUrl: userAProfile.bgImgUrl,
                        bio: userAProfile.bio,
                        location: userAProfile.location,
                        website: userAProfile.website,
                        birthdate: userAProfile.birthdate,
                        createdAt: userAProfile.createdAt,
                        followersCount: userAProfile.followersCount,
                        followingCount: userAProfile.followingCount,
                        tweetsCount: userAProfile.tweetsCount,
                        likesCount: userAProfile.likesCount,
                    }),
                    createdAt: userATweet.createdAt,
                    text: userATweet.text,
                    replies: userATweet.replies,
                    likes: userATweet.likes,
                    retweets: userATweet.retweets,
                    liked: userATweet.liked,
                    retweeted: userATweet.retweeted
                })
            }, {
                retries: 3,
                maxTimeout: 1000

            })
        })
    })
    describe('When userA replies to their tweet, ', () => {
        let userAReply;
        const userAReplyText = chance.string({ length: 16 });
        beforeAll(async () => {
            userAReply = await when.user_calls_reply({
                user: userA,
                tweetId: userATweet.id,
                text: userAReplyText
            });
        })
        describe("When user searches for their reply, ", () => {

            it('Should return the tweet', async () => {
                await retry(async () => {
                    const returnTweet = await when.user_calls_search({
                        user: userA,
                        query: userAReply.text,
                        mode: SearchMode.latest,
                        limit: 10
                    })

                    expect(returnTweet.results).toBeTruthy();
                    expect(returnTweet.nextToken).toBeFalsy();
                    expect(returnTweet.results[0]).toMatchObject({
                        __typename: 'Reply',
                        id: userAReply.id,
                        createdAt: userAReply.createdAt,
                        text: userAReplyText,
                    })
                }, {
                    retries: 3,
                    maxTimeout: 1000

                })
            })
        })
    })
})