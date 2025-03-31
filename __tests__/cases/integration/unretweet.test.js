const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const chance = require('chance').Chance()

let userA;
let tweetA;
let userB;

describe("Given authenticated user, ", () => {

    describe("When someone else retweets a tweet, ", () => {
        beforeAll(async () => {
            userA = await given.authenticated_user()
            userB = await given.authenticated_user()
            
            // User A tweets 
            const text = chance.string({ length: 16 })
            if (userA && userA.username) {
                tweetA = await when.invoke_tweet(userA.username, text);
            }

            // User B retweets User A tweet
            await when.invoke_retweet(userB.username, tweetA.id)
        })
        it("And they unretweet, ", async () => {
            await when.invoke_unretweet(userB.username, tweetA.id)
        })

        it("Should delete the retweet from Tweets", async () => {
            await then.TweetsTable_retweets_notcontains({
                author: userB.username,
                retweetOf: tweetA.id
            })

        })
        it("Should delete the retweet from Retweets", async () => {
            await then.RetweetsTable_notcontains({
                userId: userB.username, tweetId: tweetA.id
            })

        })
        it("Should decrement Tweet.retweets by 1", async () => {
            const tweetItem = await then.TweetsTable_contains(tweetA.id)
            expect(tweetItem.retweets).toBe(0)
            expect(tweetItem.retweeted).toBe(false)
        })

        it("Should decrement user.tweetsCount by 1", async () => {
            const userBItem = await then.UsersTable_contains(userB.username)
            expect(userBItem.tweetsCount).toBe(0);
        })

        it("Timeline shouldn't contain the retweet", async () => {
            const timeline = await then.get_user_timeline(userB.username)
            expect(timeline.length).toBe(0)
        })
    })
})