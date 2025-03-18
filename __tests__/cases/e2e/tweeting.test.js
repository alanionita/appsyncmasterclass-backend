const { waitSec } = require("../../lib/utils");
const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance()

require("dotenv").config()

describe("Given an authenticated user, when they send a tweet", () => {
    let user;
    let tweet;
    const text = chance.string({ length: 16 })

    beforeAll(async () => {
        user = await given.authenticated_user()

        await waitSec(2);

        if (user && user.username) {
            tweet = await when.user_calls_tweet(user, text);
        }
    })


    it("Should return new tweet", async () => {
        expect(tweet).toMatchObject({
            text,
            replies: 0,
            likes: 0,
            retweets: 0,
            retweeted: false,
            liked: false
        })
    })

    it("Should see the new tweet when calling getTweets", async () => {
        const { tweets, nextToken } = await when.user_calls_getTweets({ user, limit: 10 })
        
        expect(nextToken).toBeFalsy()
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toEqual(tweet)
    })

    it("Cannot ask more than 25 tweets", async () => {

        await expect(when.user_calls_getTweets({ user, limit: 26 })).rejects.toMatchObject({
            message: expect.stringContaining("Error: Max limit cannot be greater 25")
        })
    })
})