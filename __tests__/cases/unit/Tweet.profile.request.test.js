const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Tweet.profile.request template", () => {
    it("Should not shortcircuit if selectionSetList has more than 'id'", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Tweet.profile.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: {
                author: username
            },
            info: {
                selectionSetList: ['id', 'bio']
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            "operation": "GetItem",
            "version": "2018-05-29",
            "key": {
                "id": {
                    "S": username,
                },
            },
        })
    })
    it("Should shortcircuit if selectionSetList only 'id'", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Tweet.profile.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: {
                author: username
            },
            info: {
                selectionSetList: ['id']
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            id: username,
            __typename: "MyProfile"
        })
    })
})
