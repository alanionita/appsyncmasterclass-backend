const given = require("../../steps/given");
const then = require("../../steps/then");
const { datePattern } = require("../../lib/utils");
const chance = require('chance').Chance()


describe("Given two authenticated user, ", () => {
    let userA;
    let userB;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()
    })
    describe("When userA send a direct message to userB :", () => {
        let dm;
        const message = chance.string({ length: 16 })
        beforeAll(async () => {
            if (userA && userA.username && userB && userB.username) {
                const when = await import("../../steps/whenEsm.mjs")
                dm = await when.invoke_sendDirectMessage({
                    user: userA.username,
                    message,
                    otherUserId: userB.username
                });
            }
        })
        it("Saves direct message", async () => {
            const messageItems = await then.DirectMessagesTable_contains(dm.id)

            expect(messageItems.length).toBe(1);

            expect(messageItems).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        conversationId: messageItems[0].conversationId,
                        from: userA.username,
                        message: message,
                        messageId: expect.any(String),
                        timestamp: expect.stringMatching(datePattern)
                    })
                ])
            )
        })
        it("Adds two new Conversation entries", async () => {
            const convA = await then.ConversationsTable_contains(userA.username, userB.username)
            expect(convA).toBeDefined();
            expect(convA).toMatchObject({
                userId: userA.username,
                otherUserId: userB.username,
                lastMessage: message,
                lastModified: expect.stringMatching(datePattern),
                id: expect.any(String)
            })

            const convB = await then.ConversationsTable_contains(userB.username, userA.username)
            expect(convB).toBeDefined();
            expect(convB).toMatchObject({
                userId: userB.username,
                otherUserId: userA.username,
                lastMessage: message,
                lastModified: expect.stringMatching(datePattern),
                id: expect.any(String)
            })
        })
    })
})