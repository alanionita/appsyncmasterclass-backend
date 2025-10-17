const given = require("../../steps/given");
const when = require("../../steps/when");
const retry = require('async-retry');
const chance = require('chance').Chance()
const { HashtagsMode } = require('../../../lib/constants');
const { waitSec } = require("../../lib/utils");

require("dotenv").config()

describe("Given an authenticated user, when they send a tweet", () => {
    let userA;
    let userATweet;
    let userAProfile;

    let userAHashtag = `#${chance.string({ length: 8, alpha: true })}`;
    let userABio = "Test suit bio, " + chance.string({ length: 8 }) + ` ${userAHashtag}`;

    beforeAll(async () => {
        userA = await given.authenticated_user()

        if (userA && userA.username) {
            const userAtweetText = chance.string({ length: 16 }) + ` ${userAHashtag}`;
            userATweet = await when.user_calls_tweet(userA, userAtweetText);

            const userAProfileEdited = {
                name: userA.name,
                bio: userABio
            }

            await when.user_calls_editMyProfile(userA, userAProfileEdited);

            userAProfile = await when.user_calls_getMyProfile(userA);
        }
    })

    describe('When userA searches for hashtag, ', () => {
        it('Should return their profile on People tab', async () => {
            await retry(async () => {
                const returnProfile = await when.user_calls_searchHashtags({
                    user: userA,
                    hashtags: userAHashtag,
                    mode: HashtagsMode.people,
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
        it('Should return their tweets on Latest tab', async () => {
            await retry(async () => {
                const returnTweet = await when.user_calls_searchHashtags({
                    user: userA,
                    hashtags: userAHashtag,
                    mode: HashtagsMode.latest,
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
        const userAReplyText = chance.string({ length: 16 }) + `, ${userAHashtag}`;
        beforeAll(async () => {
            userAReply = await when.user_calls_reply({
                user: userA,
                tweetId: userATweet.id,
                text: userAReplyText
            });
            await waitSec(1);
        })
        describe("When userA searches for hashtag, ", () => {

            it('Should return their tweets on Latest tab', async () => {
                await retry(async () => {
                    const { results, nextToken } = await when.user_calls_searchHashtags({
                        user: userA,
                        hashtags: userAHashtag,
                        mode: HashtagsMode.latest,
                        limit: 10
                    })

                    expect(results).toBeTruthy();
                    expect(nextToken).toBeFalsy();
                    expect(results.length).toBe(2)

                    const tweetFound = results.filter(({ id }) => id === userATweet.id)[0];
                    const replyFound = results.filter(({ id }) => id === userAReply.id)[0];

                    expect(tweetFound).toEqual(
                        expect.objectContaining({
                            __typename: 'Tweet',
                            id: userATweet.id,
                            createdAt: userATweet.createdAt,
                            text: userATweet.text,
                        })
                    )
                    expect(replyFound).toEqual(
                        expect.objectContaining({
                            __typename: 'Reply',
                            id: userAReply.id,
                            createdAt: userAReply.createdAt,
                            text: userAReplyText,
                        })
                    )
                }, {
                    retries: 3,
                    maxTimeout: 3 * 1000
                })
            }, 15 * 1000)
        })
    })
})