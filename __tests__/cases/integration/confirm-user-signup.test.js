const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const chance = require('chance').Chance()

describe('When confirmUserSignup runs', () => {
    it("User profile should be saved in DynamoDB", async () => {
        const { name, email } = given.random_user();
        const username = chance.guid()
        const datePattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g;

        // Construct event, invoke lambda
        await when.invoke_confirmUserSignup(username, name, email);

        // Check DynamoDB table for user
        const ddbUser = await then.user_exists(username)

        expect(ddbUser).toBeTruthy();

        if (ddbUser) {
            expect(ddbUser).toMatchObject({
                id: username,
                name,
                createdAt: expect.stringMatching(datePattern),
                followersCount: 0,
                followingCount: 0,
                tweetsCount: 0,
                likesCount: 0
            })

            const [firstName, lastName] = name.split(" ")

            expect(ddbUser.screenName).toContain(firstName);
            expect(ddbUser.screenName).toContain(lastName);
        }
    })
})