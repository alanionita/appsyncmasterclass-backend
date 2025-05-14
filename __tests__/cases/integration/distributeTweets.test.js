const chance = require('chance').Chance();
const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");

let userA;
let userB;

describe("Given 2 authenticated users, and userA follows userB,", () => {
    beforeAll(async () => {
        userA = await given.authenticated_user()
        waitSec(1);
        userB = await given.authenticated_user()

        waitSec(1);
        await when.user_calls_follow({
            user: userA,
            userId: userB.username
        });
    })
    describe("When userB tweets, ", () => {
        let tweetAId = chance.guid();
        beforeAll(async () => {
            const eventInsert = require('../../data/event-payloads/new-tweet.json');
            const { NewImage } = eventInsert.Records[0].dynamodb;
            NewImage.author = {
                "S": userB.username
            };
            NewImage.id = {
                "S": tweetAId
            }
            await when.invoke_distributeTweets(eventInsert)
        })

        it("UserA timeline contains tweet from userB", async () => {
            const timeline = await then.get_user_timeline(userA.username)
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(1)
            expect(timeline[0].tweetId).toBe(tweetAId);
            expect(timeline[0].userId).toBe(userA.username);
            
        })
        it("When userB deletes tweets, userA timeline is empty", async () => {
            const eventRemove = require('../../data/event-payloads/delete-tweet.json');
            const { OldImage } = eventRemove.Records[0].dynamodb;
            OldImage.author = {
                "S": userB.username
            };
            OldImage.id = {
                "S": tweetAId
            }
            await when.invoke_distributeTweets(eventRemove)
    
            const timeline = await then.get_user_timeline(userA.username)
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(0)
        })
    })
})