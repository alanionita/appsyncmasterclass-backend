const given = require("../../steps/given")
const when = require("../../steps/when")
const chance = require("chance").Chance();
const path = require("path");

describe("Mutation.editMyProfile.request template", () => {
    it("Should produce an DynamoDB Update expression", async () => {
        const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")

        const identity = {
            username: chance.guid()
        }

        const args = {
            newProfile: {
                name: 'Test User',
            }
        }

        const context = given.random_appsync_context(identity, args)

        const result = await when.invoke_appsync_EvaluateMappingTemplate(templatePath, context.ctx)

        expect(result.operation).toBe('UpdateItem');
        expect(result.key.id.S).toBe(identity.username);
        expect(result.condition.expression).toBe('attribute_exists(id)');
        expect(result.update).toBeDefined();
        expect(result.update.expression).toBe('SET #name = :name');
        expect(result.update.expression).toBeDefined();
        expect(result.update.expressionNames).toBeDefined();
        expect(result.update.expressionValues).toBeDefined();
    })
    describe('When newProfile.name is given', () => {
        it("Should expand expression keys: expression, expressionNames, expressionValues", async () => {
            const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")

            const identity = {
                username: chance.guid()
            }

            const args = {
                newProfile: {
                    name: 'Test User',
                }
            }

            const context = given.random_appsync_context(identity, args)

            const result = await when.invoke_appsync_EvaluateMappingTemplate(templatePath, context.ctx)

            expect(result.update.expression)
                .toBe('SET #name = :name');

            expect(result.update.expressionNames["#name"]).toBe('name')
            expect(result.update.expressionValues[":name"]).toBe(args.newProfile.name)
        })
    })
    describe('When newProfile.* keys are given', () => {
        it("Should expand expression* keys from 'newProfile' keys", async () => {
            const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")

            const identity = {
                username: chance.guid()
            }

            const args = {
                newProfile: {
                    name: 'Test User',
                    bio: 'Test bio',
                    website: 'example.com'
                }
            }

            const context = given.random_appsync_context(identity, args)

            const result = await when.invoke_appsync_EvaluateMappingTemplate(templatePath, context.ctx)
            expect(result.update.expression)
                .toBe('SET #name = :name, #bio = :bio, #website = :website');

            expect(result.update.expressionNames["#bio"]).toBe('bio')
            expect(result.update.expressionValues[":bio"]).toBe(args.newProfile.bio)

            expect(result.update.expressionNames["#website"]).toBe('website')
            expect(result.update.expressionValues[":website"]).toBe(args.newProfile.website)
        })


    })
    describe('When newProfile.* keys are null', () => {
        it("Should update expression to REMOVE those attributes", async () => {
            const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")

            const identity = {
                username: chance.guid()
            }

            const args = {
                newProfile: {
                    name: 'Test User',
                    bio: null,
                    website: 'example.com'
                }
            }

            const context = given.random_appsync_context(identity, args)

            const result = await when.invoke_appsync_EvaluateMappingTemplate(templatePath, context.ctx)

            expect(result.update.expression)
                .toBe('SET #name = :name, #website = :website REMOVE #bio');

            expect(result.update.expressionNames["#bio"]).toBe('bio')
            expect(result.update.expressionValues[":bio"]).toBeUndefined()

            expect(result.update.expressionNames["#website"]).toBe('website')
            expect(result.update.expressionValues[":website"]).toBe(args.newProfile.website)
        })
    })
})