const chance = require('chance').Chance();
const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { waitSec } = require("../../lib/utils");

let userA;
let userB;
let userATweet1;
let userATweet2;

describe("Given 2 authenticated users, userA and userB, and 2 tweets for userA", () => {
    beforeAll(async () => {
        userA = await given.authenticated_user()
        waitSec(1);
        userB = await given.authenticated_user()

        waitSec(1);
        userATweet1 = await when.invoke_tweet(userA.username, chance.string({ length: 16 }));
        userATweet2 = await when.invoke_tweet(userA.username, chance.string({ length: 16 }));
        
        waitSec(1);
    })
    describe("When userB follows userA, ", () => {
        beforeAll(async () => {
            const eventInsert = require('../../data/event-payloads/follower-new.json');
            const { NewImage } = eventInsert.Records[0].dynamodb;
            
            NewImage.userId = {
                "S": userB.username
            };
            NewImage.otherUserId = {
                "S": userA.username
            }
            NewImage.sk = {
                "S": `FOLLOWS_${userA.username}`
            };
            await when.invoke_distributeTweetsToFollower(eventInsert)
            waitSec(1);
        })

        it("UserB timeline contains tweets from userB", async () => {
            const timeline = await then.get_user_timeline(userB.username)
            
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(2)

            const tweet1Found = timeline.filter(t => t.tweetId === userATweet1.id)
            const tweet2Found = timeline.filter(t => t.tweetId === userATweet2.id)

            expect(tweet1Found).toBeTruthy();
            expect(tweet1Found.length).toBe(1);
            expect(tweet2Found).toBeTruthy();
            expect(tweet2Found.length).toBe(1);
        })
        it("When userB unfollows userA,", async () => {
            const eventRemove = require('../../data/event-payloads/follower-delete.json');
            const { OldImage } = eventRemove.Records[0].dynamodb;
            OldImage.userId = {
                "S": userB.username
            };
            OldImage.otherUserId = {
                "S": userA.username
            }
            OldImage.sk = {
                "S": `FOLLOWS_${userA.username}`
            };
            await when.invoke_distributeTweetsToFollower(eventRemove)

            const timeline = await then.get_user_timeline(userB.username)
            expect(timeline).toBeTruthy()
            expect(timeline.length).toBe(0)
        })
    })

})