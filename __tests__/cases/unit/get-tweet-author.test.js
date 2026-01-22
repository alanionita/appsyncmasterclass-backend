// NOTE: 
// - Skipped because it requires a payload that needs real user UUIDs

describe.skip("When get-tweet-author is invoked, ", () => {
    let resp;
    beforeAll(async () => {
        const eventBatchInvoke = require('../../data/event-payloads/author-batch-invoke.json');
        
        const { handler } = await import("../../../functions/get-tweet-author.mjs")
        
        resp = await handler(eventBatchInvoke, {})
    })
    
    it("Returns valid *Profile data", async () => {
        const profileTypes = ['MyProfile', 'OtherProfile']
        resp.forEach(({ data }) => {
            const validType = profileTypes.includes(data.__typename)
            expect(validType).toBeTruthy()
        })
    })
})