const chance = require('chance').Chance();
const when = require("../../steps/when")

require("dotenv").config()

describe("When getImgUploadUrl runs", () => {
    it.each([
        'png', 'jpeg'
    ])("Returns a signed S3 url for file type %s", async (fileType) => {
        const username = chance.guid();
        const extension = `.${fileType}`
        const contentType = `image/${fileType}`
        const signedUrl = await when.invoke_getImgUploadUrl({
            username,
            extension,
            contentType
        })

        const { BUCKET_NAME } = process.env;
        if (!BUCKET_NAME) {
            console.error("Missing environment variable : BUCKET_NAME")
            return;
        }
        const s3Host = 's3-accelerate'
        const awsHost = 'amazonaws.com'
        const signedUrlPattern = new RegExp(`https://${BUCKET_NAME}.${s3Host}.${awsHost}/${username}/.*.${fileType}\?`)
        expect(signedUrl).toMatch(signedUrlPattern)
    })

    it("Should default to ContentType jpeg when none is provided", async () => {
        const username = chance.guid();
        const fileType = 'jpeg'
        const extension = `.${fileType}`
        const signedUrl = await when.invoke_getImgUploadUrl({
            username,
            extension,
            contentType: undefined
        })

        const { BUCKET_NAME } = process.env;
        if (!BUCKET_NAME) {
            console.error("Missing environment variable : BUCKET_NAME")
            return;
        }
        const s3Host = 's3-accelerate'
        const awsHost = 'amazonaws.com'
        const signedUrlPattern = new RegExp(`https://${BUCKET_NAME}.${s3Host}.${awsHost}/${username}/.*.${fileType}\?`)
        expect(signedUrl).toMatch(signedUrlPattern)
    })

    it("Should throw for missing extension", async () => {
        const username = chance.guid();
        await expect(async () => {
            await when.invoke_getImgUploadUrl({
                username,
                extension: undefined,
                contentType: undefined
            })
        }).rejects.toThrow()
    })
})
