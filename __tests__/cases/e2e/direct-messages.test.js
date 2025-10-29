const given = require("../../steps/given");
const when = require("../../steps/when");
const chance = require('chance').Chance();
const { datePattern } = require('../../lib/utils/index');
const { GraplQLClient } = require('../../lib/appsyncClient');

require("dotenv").config()

const { APPSYNC_HTTP_URL, REGION } = process.env

describe("Given 2 authenticated users, ", () => {
    let userA;
    let userB;
    let userAProfile;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            userAProfile = await when.user_calls_getMyProfile(userA)
        }
    })
    describe('When userA sends a message to userB', () => {
        let appsyncClient;
        let dm;
        const dmText = chance.string({ length: 16 })
        beforeAll(async () => {
            appsyncClient = new GraplQLClient({
                region: REGION,
                appSyncUrl: APPSYNC_HTTP_URL,
                accessToken: userA.accessToken
            })

            const vars = {
                otherUserId: userB.username,
                message: dmText
            }

            dm = await appsyncClient.sendDirectMessage(vars);
        })

        it("userA should get a valid Conversation", async () => {
            expect(dm).toBeDefined();
            expect(dm).toMatchObject({
                id: expect.any(String),
                lastMessage: dmText,
                lastModified: expect.stringMatching(datePattern)
            })
            expect(dm.id).toContain(userA.username)
            expect(dm.id).toContain(userB.username)
        })
    })
    describe('When userB sends a message to userA', () => {
        let appsyncClient;
        let dm;
        const dmText = chance.string({ length: 16 })
        beforeAll(async () => {
            appsyncClient = new GraplQLClient({
                region: REGION,
                appSyncUrl: APPSYNC_HTTP_URL,
                accessToken: userB.accessToken
            })

            const vars = {
                otherUserId: userA.username,
                message: dmText
            }
            dm = await appsyncClient.sendDirectMessage(vars);
        })

        it("userB should get a valid Conversation", async () => {
            expect(dm).toBeDefined();
            expect(dm).toMatchObject({
                id: expect.any(String),
                lastMessage: dmText,
                lastModified: expect.stringMatching(datePattern)
            })
            expect(dm.id).toContain(userB.username)
            expect(dm.id).toContain(userA.username)
        })
        it("userB should get the other user profile from Conversation", async () => {
            expect(dm).toBeDefined();
            
            expect(dm.otherUser).toMatchObject(userAProfile)
        })
    })
}, 15 * 1000)