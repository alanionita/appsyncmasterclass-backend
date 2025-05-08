const given = require("../../steps/given");
const when = require("../../steps/when");

require("dotenv").config()

describe("Given 2 authenticated users", () => {
    let userA;
    let userB;
    let userAProfile;
    let userBProfile;

    beforeAll(async () => {
        userA = await given.authenticated_user()
        userB = await given.authenticated_user()

        if (userA && userA.username) {
            userAProfile = await when.user_calls_getMyProfile(userA);
        }
        if (userB && userB.username) {
            userBProfile = await when.user_calls_getMyProfile(userB);
        }
    })
    describe('When userA follows userB', () => {
        beforeAll(async () => {
            await when.user_calls_follow({
                user: userA,
                userId: userB.username
            });
        })

        it("UserA should see following for UserB", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({ 
                user: userA, screenName: userBProfile.screenName 
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(false);
        })
        it("UserB should see followedBy for UserA", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({ 
                user: userB, screenName: userAProfile.screenName 
            })
            expect(following).toBe(false);
            expect(followedBy).toBe(true);
        })
    })

    describe('When userB follows userA', () => {
        beforeAll(async () => {
            await when.user_calls_follow({
                user: userB,
                userId: userA.username
            });
        })

        it("UserA should see following and followedBy for UserB", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({ 
                user: userB, screenName: userAProfile.screenName 
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(true);
        })
        it("UserB should see followedBy and following for UserA", async () => {
            const { following, followedBy } = await when.user_calls_getProfile({ 
                user: userA, screenName: userBProfile.screenName 
            })
            expect(following).toBe(true);
            expect(followedBy).toBe(true);
        })
    })
})