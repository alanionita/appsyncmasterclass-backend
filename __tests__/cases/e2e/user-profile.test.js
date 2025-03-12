const given = require("../../steps/given");
const when = require("../../steps/when");
const { fetchDatePattern } = require("../../lib/utils");

describe("Given and authenticated user", () => {
    let user;
    const datePattern = fetchDatePattern();

    beforeAll(async () => {
        user = await given.authenticated_user();
    })


    it("User can fetch their profile with getMyProfile", async () => {
        const profile = await when.user_calls_getMyProfile(user)

        expect(profile).toMatchObject({
            id: user.username,
            name: user.name,
            imgUrl: null,
            bgImgUrl: null,
            bio: null,
            location: null,
            website: null,
            birthdate: null,
            createdAt: expect.stringMatching(datePattern),
            followersCount: 0,
            followingCount: 0,
            tweetsCount: 0,
            likesCount: 0,
            // tweets // Not implemented because tweets resolver is missing
        })

        const [firstName, lastName] = profile.name.split(" ")

        expect(profile.screenName).toContain(firstName);
        expect(profile.screenName).toContain(lastName);
    
    })
})