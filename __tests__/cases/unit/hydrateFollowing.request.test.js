const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Query.getFollowers / hydrateFollowing.request template", () => {
    it("Should return empty array if prev.result.relationships is empty", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/hydrateFollowing.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            prev: { result: { relationships: [] } }
        })

        const result = when.invoke_appsync_template(templatePath, context)
        expect(result).toEqual({profiles: []})
    })

    it("Should convert relationships to UsersTable, BatchGetItem keys", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/hydrateFollowing.request.vtl")
        const username = chance.guid()
        const userId1 = chance.guid()
        const otherUserId1 = chance.guid()

        const relationships = [{
            userId: userId1,
            otherUserId: otherUserId1
        }]

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: {},
            prev: { result: { relationships } }
        })

        const result = when.invoke_appsync_template(templatePath, context)

        expect(result).toMatchObject({
            "version": "2018-05-29",
            "operation": "BatchGetItem",
            "tables": {
                "${UsersTable}": {
                    "keys": [
                        {
                            "id": {
                                "S": otherUserId1
                            }
                        }
                    ],
                    "consistentRead": false,
                }
            }
        })
    })
})