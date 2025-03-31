const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("TimelinePage.tweets.request template", () => {
    it("Should return empty array if source.tweets is empty", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/UnhydratedTweetsPage.tweets.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: { tweets: [] }
        })

        const result = when.invoke_appsync_template(templatePath, context)
        expect(result).toEqual([])
    })

    it("Should convert timeline tweets on BatchGetItem keys", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/UnhydratedTweetsPage.tweets.request.vtl")
        const username = chance.guid()
        const tweetId1 = chance.guid()
        const tweetId2 = chance.guid()

        const tweets = [{
            userId: username,
            tweetId: tweetId1,
        }, {
            userId: username,
            tweetId: tweetId2,
        }]

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: { tweets }
        })

        const result = when.invoke_appsync_template(templatePath, context)

        expect(result).toMatchObject({
            "version": "2018-05-29",
            "operation": "BatchGetItem",
            "tables": {
                "${TweetsTable}": {
                    "keys": [
                        {
                            "id": {
                                "S": tweetId1
                            }
                        },
                        {
                            "id": {
                                "S": tweetId2
                            }
                        }
                    ],
                    "consistentRead": false,
                }
            }
        })
    })
})