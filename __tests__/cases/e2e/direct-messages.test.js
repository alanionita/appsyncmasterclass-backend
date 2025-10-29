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

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()
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

        it("userA should get a valid Conversation response", async () => {
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
}, 15 * 1000)