const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Replied.profile.response template", () => {
    it("Should set __typename as 'MyProfile' for current user", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Replied.profile.response.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {
                id: username
            },
            source: {
                userId: username,
                repliedBy: username
            }
        })
        const result = when.invoke_appsync_template(templatePath, context);
        expect(result).toEqual({
            id: username,
            __typename: "MyProfile"
        })
    })

    it("Should set __typename as 'OtherProfile' for other users", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Replied.profile.response.vtl")
        const username = chance.guid()
        const otherId = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {
                id: otherId
            },
            source: {
                userId: username,
                repliedBy: otherId
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            id: otherId,
            __typename: "OtherProfile"
        })
    })
})