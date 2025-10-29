const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance();
const { datePattern, waitSec } = require('../../lib/utils/index');
const { GraplQLClient } = require('../../lib/appsyncClient');

require("dotenv").config()

const { APPSYNC_HTTP_URL, REGION } = process.env

describe("Given 2 authenticated users, ", () => {
    let userA;
    let userB;
    let userAProfile;
    let dmA;
    let dmAText;
    let dmB;
    let dmBText;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            userAProfile = await when.user_calls_getMyProfile(userA)
        }
    })
    describe('When userA sends a message to userB', () => {
        let appsyncClient;
        dmAText = chance.string({ length: 16 })
        beforeAll(async () => {
            appsyncClient = new GraplQLClient({
                region: REGION,
                appSyncUrl: APPSYNC_HTTP_URL,
                accessToken: userA.accessToken
            })

            const vars = {
                otherUserId: userB.username,
                message: dmAText
            }

            dmA = await appsyncClient.sendDirectMessage(vars);
        })

        it("userA should get a valid Conversation with last message", async () => {
            expect(dmA).toBeDefined();
            expect(dmA).toMatchObject({
                id: expect.any(String),
                lastMessage: dmAText,
                lastModified: expect.stringMatching(datePattern)
            })
            expect(dmA.id).toContain(userA.username)
            expect(dmA.id).toContain(userB.username)
        })
        describe('When userA lists their conversations', () => {
            let conversations;
            beforeAll(async () => {
                const vars = {
                    limit: 10,
                }
                conversations = await appsyncClient.listConversations(vars);
            })
            it("userA should see the last message dmA", async () => {
                expect(conversations).toBeDefined();
                expect(conversations).toMatchObject({
                    nextToken: null,
                    conversations: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String),
                            lastMessage: dmAText,
                            lastModified: dmA.lastModified
                        })

                    ])
                })
                expect(conversations.conversations.length).toBe(1)
            })
        }, 15 * 1000)
    })
    describe('When userB sends a message to userA', () => {
        let appsyncClient;
        dmBText = chance.string({ length: 16 })
        beforeAll(async () => {
            appsyncClient = new GraplQLClient({
                region: REGION,
                appSyncUrl: APPSYNC_HTTP_URL,
                accessToken: userB.accessToken
            })

            const vars = {
                otherUserId: userA.username,
                message: dmBText
            }
            dmB = await appsyncClient.sendDirectMessage(vars);
        })

        it("userB should get a valid Conversation with new message", async () => {
            expect(dmB).toBeDefined();
            expect(dmB).toMatchObject({
                id: expect.any(String),
                lastMessage: dmBText,
                lastModified: expect.stringMatching(datePattern)
            })
            expect(dmB.id).toContain(userB.username)
            expect(dmB.id).toContain(userA.username)
        })
        it("userB should get the other user profile from Conversation", async () => {
            expect(dmB).toBeDefined();

            expect(dmB.otherUser).toMatchObject(userAProfile)
        })
        describe('When userB lists their conversations', () => {
            let conversations;
            beforeAll(async () => {
                const vars = {
                    limit: 10,
                }
                conversations = await appsyncClient.listConversations(vars);
            })
            it("userB should see their last posted message", async () => {
                expect(conversations).toBeDefined();
                expect(conversations).toMatchObject({
                    nextToken: null,
                    conversations: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String),
                            lastMessage: dmBText,
                            lastModified: expect.stringMatching(datePattern)
                        })

                    ])
                })
                expect(conversations.conversations.length).toBe(1)
                expect(conversations.conversations[0].otherUser).toBeDefined()
                expect(conversations.conversations[0].otherUser).toMatchObject(userAProfile)
            })
        }, 15 * 1000)
    })

}, 15 * 1000)