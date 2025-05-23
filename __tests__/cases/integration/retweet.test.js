const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");
const chance = require('chance').Chance()

let userA;
let tweetA;
let userB;

describe("Given authenticated user, ", () => {
    describe("When they retweet own tweet, ", () => {
        const text = chance.string({ length: 16 })
        beforeAll(async () => {
            userA = await given.authenticated_user()
            await waitSec(2);
            if (userA && userA.username) {
                tweetA = await when.invoke_tweet(userA.username, text);
            }

            await when.invoke_retweet(userA.username, tweetA.id)
        })
        it("Saves the retweet as new tweet", async () => {
            await then.TweetsTable_retweets_contains({
                author: userA.username,
                retweetOf: tweetA.id
            })

        })
        it("Saves the retweet", async () => {
            await then.RetweetsTable_contains({
                userId: userA.username, tweetId: tweetA.id
            })

        })
        it("Increments Tweet.retweets by 1", async () => {
            const tweetItem = await then.TweetsTable_contains(tweetA.id)
            expect(tweetItem.retweets).toBe(1)
        })

        it("Increments user.tweetsCount by 1", async () => {
            const userItem = await then.UsersTable_contains(userA.username)
            expect(userItem.tweetsCount).toBe(2);
        })

        it("Timeline remains unchanged", async () => {
            const timeline = await then.get_user_timeline(userA.username)
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(1)
        })
    })
    describe("When someone else retweets their tweet, ", () => {
        beforeAll(async () => {
            userB = await given.authenticated_user()
            await waitSec(2);

            // User B retweets User A tweet
            await when.invoke_retweet(userB.username, tweetA.id)
        })
        it("Saves the retweet as new tweet", async () => {
            await then.TweetsTable_retweets_contains({
                author: userB.username,
                retweetOf: tweetA.id
            })

        })
        it("Saves the retweet", async () => {
            await then.RetweetsTable_contains({
                userId: userB.username, tweetId: tweetA.id
            })

        })
        it("Increments Tweet.retweets by 1", async () => {
            const tweetItem = await then.TweetsTable_contains(tweetA.id)
            expect(tweetItem.retweets).toBe(2)
        })

        it("Increments user.tweetsCount by 1", async () => {
            const userBItem = await then.UsersTable_contains(userB.username)
            expect(userBItem.tweetsCount).toBe(1);
        })

        it("Timeline includes retweet", async () => {
            const timeline = await then.get_user_timeline(userB.username)
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(1)
        })
    })
})