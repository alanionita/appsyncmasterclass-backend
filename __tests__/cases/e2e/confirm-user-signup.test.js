const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");

describe('When a user signs up', () => {
    it("User profile should be saved in DynamoDB", async () => {
        const datePattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g;

        const { name, email, password } = given.random_user();

        const user = await when.user_signs_up(password, name, email);

        const ddbUser = await then.user_exists(user.username)

        expect(ddbUser).toBeTruthy();

        if (ddbUser) {
            expect(ddbUser).toMatchObject({
                id: user.username,
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