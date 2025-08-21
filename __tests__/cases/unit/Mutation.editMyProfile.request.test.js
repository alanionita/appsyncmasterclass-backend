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
            expect(result.update.expressionValues[":name"]).toMatchObject({
                "S": args.newProfile.name
            })
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
            expect(result.update.expressionValues[":bio"]).toMatchObject({
                "S": args.newProfile.bio
            })

            expect(result.update.expressionNames["#website"]).toBe('website')
            expect(result.update.expressionValues[":website"]).toMatchObject({
                "S": args.newProfile.website
            })
        });
        it("Should handle imgUrl from 'newProfile' keys", async () => {
            const templatePath = path.resolve(__dirname, "../../../appsync/resolvers/Mutation.editMyProfile.request.vtl")

            const identity = {
                username: chance.guid()
            }

            const args = {
                newProfile: {
                    name: 'Test User',
                    imgUrl: 'https://appsyncmasterclass-backend-dev-assetsbucket-uzasvskxkdto.s3.eu-west-2.amazonaws.com/36921294-e011-700d-727e-c5e3a7827014/01K36GDK5BFP8H5ERNWD6M20ZQ.jpg',
                }
            }

            const context = given.random_appsync_context(identity, args)

            const result = await when.invoke_appsync_EvaluateMappingTemplate(templatePath, context.ctx)

            console.log('result ', JSON.stringify(result))
            expect(result.update.expression)
                .toBe('SET #name = :name, #imgUrl = :imgUrl');

            expect(result.update.expressionNames["#imgUrl"]).toBe('imgUrl')
            expect(result.update.expressionValues[":imgUrl"]).toMatchObject({
                "S": args.newProfile.imgUrl
            })
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
            expect(result.update.expressionValues[":website"]).toMatchObject({
                "S": args.newProfile.website
            })
        })
    })
})