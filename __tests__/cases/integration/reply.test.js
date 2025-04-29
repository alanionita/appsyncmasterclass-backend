const chance = require('chance').Chance();
const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");

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

        describe("When userB replies to tweetA, ", () => {
            const replyText = chance.string({ length: 16 })
            let tweetReply;
            beforeAll(async () => {
                waitSec(1);
                if (tweetA.id) {
                    tweetReply = await when.invoke_reply({ 
                        username: userB.username, 
                        tweetId: tweetA.id, 
                        text: replyText 
                    });
                }
            })

            it("Saves the reply as new tweet", async () => {
                const replyItems = await then.TweetsTable_replies_contains({
                    author: userB.username,
                    inReplyToTweet: tweetA.id
                })

                const foundReply = replyItems.filter(r => {
                    if (r.inReplyToTweet === tweetA.id && r.text === replyText) {
                        return r;
                    }
                })[0]

                expect(foundReply).toBeTruthy();

                expect(foundReply).toMatchObject({
                    __typename: "Reply",
                    text: replyText,
                    author: userB.username,
                    replies: 0,
                    likes: 0,
                    retweets: 0,
                    inReplyToTweet: tweetA.id,
                    inReplyToUsers: [userA.username]
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
    })
})