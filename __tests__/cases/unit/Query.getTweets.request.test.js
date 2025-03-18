const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Query.getTweets.request template", () => {
    it("Should throw if limit greater than 25", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Query.getTweets.request.vtl")
        const username = chance.guid()
        const limit = 26;
        const nextToken = chance.guid()

        const context = given.random_appsync_context(
            { username }, 
            { 
                userId: username, 
                limit, 
                nextToken 
            })

        expect(() => when.invoke_appsync_template(templatePath, context)).toThrow("Error: Max limit cannot be greater 25")
    })
    it("Should match expectation when all arguments are correct: userId, limit, nextToken", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Query.getTweets.request.vtl")
        const username = chance.guid()
        const limit = 10;
        const nextToken = chance.guid()

        const context = given.random_appsync_context(
            { username }, 
            { 
                userId: username, 
                limit, 
                nextToken 
            })

        const result = when.invoke_appsync_template(templatePath, context);
        expect(result).toEqual({
            "version": "2018-05-29",
            "operation": "Query",
            "query": {
                "expression": "author = :userId",
                "expressionValues": {
                    ":userId": {
                        "S": username
                    }
                }
            },
            "index": "byCreator",
            "limit": limit,
            "scanIndexForward": false,
            "consistentRead": false,
            "select": "ALL_ATTRIBUTES",
        })
    })
    it("Should ommit nextToken, when arguments.nextToken not provided", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Query.getTweets.request.vtl")
        const username = chance.guid()
        const limit = 10;

        const context = given.random_appsync_context(
            { username }, 
            { 
                userId: username, 
                limit,
                nextToken: null
            })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            "version": "2018-05-29",
            "operation": "Query",
            "query": {
                "expression": "author = :userId",
                "expressionValues": {
                    ":userId": {
                        "S": username
                    }
                }
            },
            "index": "byCreator",
            "limit": limit,
            "scanIndexForward": false,
            "consistentRead": false,
            "select": "ALL_ATTRIBUTES",
        })
    })
})