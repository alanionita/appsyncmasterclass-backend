const chance = require('chance').Chance();
const when = require("../../steps/when")

require("dotenv").config()

describe("When getImgUploadUrl runs", () => {
    it.each([
        'png', 'jpeg'
    ])("Returns a signed S3 url for file type %s", async (fileType) => {
        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variables")
            return;
        }
        
        const username = chance.guid();
        const extension = `.${fileType}`
        const contentType = `image/${fileType}`
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const urlPathPattern = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/.*.${fileType}`
        const urlTokenPattern = `?(?:.*&)`
        const signedUrlPattern = new RegExp(`${urlPathPattern}${urlTokenPattern}`)

        const res = await when.invoke_getImgUploadUrl({
            username,
            extension,
            contentType
        })

        expect(res.url).toBeDefined();
        expect(res.fileKey).toBeDefined();
        expect(res.url).toMatch(signedUrlPattern)
        expect(res.fileKey.includes(username)).toBeTruthy()
        expect(res.fileKey.includes(`.${fileType}`)).toBeTruthy()
    })

    it("Should default to ContentType jpeg when none is provided", async () => {
        const username = chance.guid();
        const fileType = 'jpeg'
        const extension = `.${fileType}`
        const res = await when.invoke_getImgUploadUrl({
            username,
            extension,
            contentType: undefined
        })

        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variables")
            return;
        }
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const urlPathPattern = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/.*.${fileType}`
        const urlTokenPattern = `?(?:.*&)`
        const signedUrlPattern = new RegExp(`${urlPathPattern}${urlTokenPattern}`)
        expect(res.url).toBeDefined();
        expect(res.fileKey).toBeDefined();
        expect(res.url).toMatch(signedUrlPattern)
        expect(res.fileKey.includes(username)).toBeTruthy()
        expect(res.url).toMatch(signedUrlPattern)
        expect(res.fileKey.includes('.jpeg')).toBeTruthy()
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
