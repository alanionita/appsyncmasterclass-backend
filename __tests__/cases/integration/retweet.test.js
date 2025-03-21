const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");
const chance = require('chance').Chance()

let userA;
let tweetA;

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
            const timelineItem = await then.get_user_timeline(userA.username)
            expect(timelineItem.length).toBe(1)
        })
    })
})