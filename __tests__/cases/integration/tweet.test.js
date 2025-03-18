const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");
const chance = require('chance').Chance()


describe("Given authenticated user, when they send a tweet :", () => {
    let user;
    let tweet;
    const text = chance.string({ length: 16 })

    beforeAll(async () => {
        user = await given.authenticated_user()

        await waitSec(2);

        if (user && user.username) {
            tweet = await when.invoke_tweet(user.username, text);
        }
    })
    it("Saves tweet", async () => {
        await then.TweetsTable_contains(tweet.id)

    })
    it("Adds new timeline entry", async () => {
        await then.TimelinesTable_contains(user.username, tweet.id)
    })
    it("Increments user.tweetsCount by 1", async () => {
        const userData = await then.UsersTable_contains(user.username)

        expect(userData.tweetsCount).toBe(1);
    })
})