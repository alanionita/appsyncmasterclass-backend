const chance = require('chance').Chance();
const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");
const { TweetTypes } = require('../../../lib/constants');

let userA;
let userB;

describe("Given 2 authenticated users, userA & userB", () => {
    beforeAll(async () => {
        userA = await given.authenticated_user()
        waitSec(1);
        userB = await given.authenticated_user()
    })
    describe("When userA sends tweet, ", () => {
        let tweetA;
        beforeAll(async () => {
            const text = chance.string({ length: 16 })
            if (userA && userA.username) {
                tweetA = await when.invoke_tweet(userA.username, text);
            }
        })

        describe("When userB replies to userA, tweetA, ", () => {
            const replyTextA = chance.string({ length: 16 })
            beforeAll(async () => {
                waitSec(1);
                if (tweetA.id) {
                    await when.invoke_reply({
                        username: userB.username,
                        tweetId: tweetA.id,
                        text: replyTextA
                    });
                }
            })

            it("Saves the reply as new tweet", async () => {
                const replyItems = await then.TweetsTable_replies_contains({
                    author: userB.username,
                    inReplyToTweetId: tweetA.id
                })

                const foundReply = replyItems.filter(r => {
                    if (r.inReplyToTweetId === tweetA.id && r.text === replyTextA) {
                        return r;
                    }
                })[0]

                expect(foundReply).toBeTruthy();

                expect(foundReply).toMatchObject({
                    __typename: TweetTypes.REPLY,
                    text: replyTextA,
                    author: userB.username,
                    replies: 0,
                    likes: 0,
                    retweets: 0,
                    inReplyToTweetId: tweetA.id,
                    inReplyToUserIds: [userA.username]
                })
            })

            it("Increments Tweet.replies by 1", async () => {
                const tweetItem = await then.TweetsTable_contains(tweetA.id)
                expect(tweetItem.replies).toBe(1)
            })

            it("Increments userB.tweetsCount by 1", async () => {
                const userItem = await then.UsersTable_contains(userB.username)
                expect(userItem.tweetsCount).toBe(1);
            })

            it("Timeline contains reply for userB", async () => {
                const timeline = await then.get_user_timeline(userB.username)
                expect(timeline).toBeTruthy()
                expect(timeline.length).toBe(1)
                expect(timeline[0].inReplyToTweetId).toEqual(tweetA.id)
            })
        })
        describe("When userB retweets to userA, tweetA, ", () => {
            let userBRetweet;
            beforeAll(async () => {
                waitSec(1);
                if (tweetA.id) {
                    await when.invoke_retweet(userB.username, tweetA.id);

                    waitSec(1);

                    userBRetweet = await then.TweetsTable_retweets_contains({
                        author: userB.username, 
                        retweetOf: tweetA.id
                    })
                }
            })

            describe('When userA replies to userB retweet (userBRetweet)', () => {
                const replyTextB = chance.string({ length: 16 })
                
                beforeAll(async () => {
                    waitSec(1);
                    if (userBRetweet.id) {
                        await when.invoke_reply({
                            username: userA.username,
                            tweetId: userBRetweet.id,
                            text: replyTextB
                        });
                    }
                })

                it("Saves the reply as new tweet", async () => {
                    
                    const replyItems = await then.TweetsTable_replies_contains({
                        author: userA.username,
                        inReplyToTweetId: userBRetweet.id
                    })

                    const foundReply = replyItems.filter(r => {
                        if (r.inReplyToTweetId === userBRetweet.id && r.text === replyTextB) {
                            return r;
                        }
                    })[0]

                    expect(foundReply).toBeTruthy();

                    expect(foundReply).toMatchObject({
                        __typename: TweetTypes.REPLY,
                        text: replyTextB,
                        author: userA.username,
                        replies: 0,
                        likes: 0,
                        retweets: 0,
                        inReplyToTweetId: userBRetweet.id,
                        inReplyToUserIds: expect.arrayContaining([userA.username, userB.username])
                    })
                    
                    expect(foundReply.inReplyToUserIds).toHaveLength(2)
                })
            })
        })
    })
})