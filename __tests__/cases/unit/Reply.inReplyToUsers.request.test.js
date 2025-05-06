const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Reply.inReplyToUsers.request template", () => {
    it("Should not shortcircuit if selectionSetList has more than 'id'", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Reply.inReplyToUsers.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { username },
            args: {},
            result: {},
            source: {
                inReplyToUserIds: [username]
            },
            info: {
                selectionSetList: ['id', 'bio']
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            "version" : "2018-05-29",
            "operation" : "BatchGetItem",
            "tables" : {
                "${UsersTable}": {
                   "keys": [{
                    "id": {
                        "S": username
                    }
                   }],
                    "consistentRead": false,
                }
            }
        })
    })
    it("Should shortcircuit if selectionSetList only 'id'", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Reply.inReplyToUsers.request.vtl")
        const username1 = chance.guid()
        const username2 = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { 
                username: username1 
            },
            args: {},
            result: {},
            source: {
                inReplyToUserIds: [username1, username2]
            },
            info: {
                selectionSetList: ['id']
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);
        expect(result).toEqual([{
            id: username1,
            __typename: "MyProfile"
        },{
            id: username2,
            __typename: "OtherProfile"
        }])
    })
    it("Should return empty for empty inReplyToUserIds", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Reply.inReplyToUsers.request.vtl")
        const username = chance.guid()

        const context = given.random_appsync_contextV2({
            identity: { 
                username
            },
            args: {},
            result: {},
            source: {
                inReplyToUserIds: []
            },
            info: {
                selectionSetList: ['id']
            }
        })

        const result = when.invoke_appsync_template(templatePath, context);
        expect(result).toEqual([])
    })
})
