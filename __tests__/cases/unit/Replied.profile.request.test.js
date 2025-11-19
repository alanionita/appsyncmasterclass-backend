const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Replied.profile.request template", () => {
    it("Should return valid query", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Replied.profile.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: {
                repliedBy: username
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            "operation": "GetItem",
            "version": "2018-05-29",
            "key": {
                "id": {
                    "S": username
                }
            }
        })
    })
})
