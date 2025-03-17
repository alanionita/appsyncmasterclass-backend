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
            // tweets // Not implemented because tweets resolver is missing
        })

        const [firstName, lastName] = profile.name.split(" ")

        expect(profile.screenName).toContain(firstName);
        expect(profile.screenName).toContain(lastName);

    })

    it("The user can get a URL to upload new profile image", async () => {
        const fileType = 'png';
        const { extension, contentType } = makeExtContentType(fileType)
        const uploadUrl = await when.user_calls_getImageUploadUrl({
            user,
            extension,
            contentType
        })

        const { BUCKET_NAME } = process.env;

        if (BUCKET_NAME) {
            const signedUrlPattern = makeSignedUrlPattern({
                bucket: BUCKET_NAME,
                username: user.username,
                fileType
            })

            expect(uploadUrl).toMatch(signedUrlPattern)

            const filePath = path.join(__dirname, '../../data/appsync.png');
            await then.user_upload({
                uploadUrl, 
                filePath, 
                contentType
            })
            const downloadUrl = uploadUrl.split('?')[0];
            const [protocol, _, host, folder, file] = downloadUrl.split("/");
            await then.user_download(`${folder}/${file}`)
        }
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
})