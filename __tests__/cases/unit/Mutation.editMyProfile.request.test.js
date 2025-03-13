const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Mutation.editMyProfile.request template", () => {
    it("Should use 'newProfile' fields in expression values", () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")
        const username = chance.guid()
        const newProfile = {
            name: 'Test McTest',
            bio: 'test',
            imgUrl: null,
            bgImgUrl: null,
            location: null,
            website: null,
            birthdate: null,
        }
        const context = given.random_appsync_context({ username }, { newProfile })

        const result = when.invoke_appsync_template(templatePath, context);

        expect(result).toEqual({
            "version": "2018-05-29",
            "operation": "UpdateItem",
            "key": {
                "id": {
                    S: username
                }
            },
            "update": {
                "expression": "set #name = :name, imgUrl = :imgUrl, bgImgUrl = :bgImgUrl, bio = :bio, #location = :location, website = :website, birthdate = :birthdate",
                "expressionNames": {
                    "#name": "name",
                    "#location": "location"
                },
                "expressionValues": {
                    ":name": {
                        S: 'Test McTest'
                    },
                    ":bio": {
                        S: 'test'
                    },
                    ":imgUrl": {
                        NULL: true
                    },
                    ":bgImgUrl": {
                        NULL: true
                    },
                    ":location": {
                        NULL: true
                    },
                    ":website": {
                        NULL: true
                    },
                    ":birthdate": {
                        NULL: true
                    }
                }
            },
            "condition": {
                "expression": "attribute_exists(id)"
            },

        })
    })
})