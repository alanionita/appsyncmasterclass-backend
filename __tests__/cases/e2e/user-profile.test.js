const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const { fetchDatePattern, makeSignedUrlPattern, makeExtContentType } = require("../../lib/utils");
const path = require("path");

require("dotenv").config()

describe("Given and authenticated user", () => {
    let user;
    let profile;
    const datePattern = fetchDatePattern();

    beforeAll(async () => {
        user = await given.authenticated_user();
    })


    it("User can fetch their profile with getMyProfile", async () => {
        profile = await when.user_calls_getMyProfile(user)

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
            tweets: {
                tweets: []
            }
        })

        const [firstName, lastName] = profile.name.split(" ")

        expect(profile.screenName).toContain(firstName);
        expect(profile.screenName).toContain(lastName);

    })

    it("The user can get a URL to upload new profile image", async () => {
        const fileType = 'png';
        const { extension, contentType } = makeExtContentType(fileType)
        const { url, fileKey } = await when.user_calls_getImageUploadUrl({
            user,
            extension,
            contentType
        })

        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variables")
            return;
        }

        const signedUrlPattern = makeSignedUrlPattern({
            bucket: BUCKET_NAME,
            region: REGION,
            username: user.username,
            fileType
        })

        expect(url).toMatch(signedUrlPattern)
        expect(fileKey.includes(fileType)).toBeTruthy()
        expect(fileKey.includes(user.username)).toBeTruthy()

        const filePath = path.join(__dirname, '../../data/appsync.png');
        await then.user_upload({
            uploadUrl: url,
            filePath,
            contentType
        })
        await then.user_download(fileKey)
    })

    it("User can edit their profile with editMyProfile", async () => {
        const rand = given.random_name_email()
        const input = {
            name: rand.name
        }

        const newProfile = await when.user_calls_editMyProfile(user, input)

        expect(newProfile).toMatchObject({
            ...profile,
            name: rand.name
        })

        const [firstName, lastName] = profile.name.split(" ")

        expect(newProfile.screenName).toContain(firstName);
        expect(newProfile.screenName).toContain(lastName);

    })

    it('Tweets array contains users tweets', async () => {
        const tweetText = 'Hello World';
        await when.user_calls_tweet(user, tweetText);

        const myProfile = await when.user_calls_getMyProfile(user)

        expect(myProfile.tweets.tweets.length).toBe(1);
        expect(myProfile.tweets.tweets[0]).toMatchObject({
            text: tweetText
        })
    })
})