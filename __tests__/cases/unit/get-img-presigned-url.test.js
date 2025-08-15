const chance = require('chance').Chance();
const when = require("../../steps/when");
const { extractTokenValue, isExpired, getTokensAndFilepath, nowDateToAmzDate} = require('../../lib/awsUrls');

require("dotenv").config()

describe("When getImagePresignedUrl runs", () => {
    it("Should throw for: Unexpected Event", async () => {
        const { BUCKET_NAME } = process.env;
        if (!BUCKET_NAME) {
            console.error("Missing environment variable : BUCKET_NAME")
            return;
        }
        const fileType = 'jpeg'
        const username = chance.guid();
        const fileName = 'testFile'
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const amzDate = `X-Amz-Date=${nowDateToAmzDate()}` // now
        const amzExpires = 'X-Amz-Expires=300'
        const amzId = 'x-id=GetObject'
        const imgUrl = `https://${BUCKET_NAME}.${s3Host}.${awsHost}/${username}/${fileName}.${fileType}\?${amzId}&${amzDate}&${amzExpires}`

        await expect(async () => {
            await when.invoke_getImgPresignedUrl({
                username: undefined,
                url: imgUrl
            })
        }).rejects.toThrow()
    })

    it("Should throw for: Unexpected x-id", async () => {
        const { BUCKET_NAME } = process.env;
        if (!BUCKET_NAME) {
            console.error("Missing environment variable : BUCKET_NAME")
            return;
        }
        const fileType = 'jpeg'
        const username = chance.guid();
        const fileName = 'testFile'
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const amzDate = `X-Amz-Date=${nowDateToAmzDate()}` // now
        const amzExpires = 'X-Amz-Expires=300'
        const amzId = 'x-id=PutObject'
        const imgUrl = `https://${BUCKET_NAME}.${s3Host}.${awsHost}/${username}/${fileName}.${fileType}\?${amzId}&${amzDate}&${amzExpires}`

        await expect(async () => {
            await when.invoke_getImgPresignedUrl({
                username: undefined,
                url: imgUrl
            })
        }).rejects.toThrow()
    })

    it("Should throw for: Unexpected url shape", async () => {
        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variable : BUCKET_NAME")
            return;
        }
        const fileType = 'jpeg'
        const username = chance.guid();
        const fileName = 'testFile'
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const amzId = 'x-id=GetObject'
        const amzDate = `X-Amz-Date=${nowDateToAmzDate()}` // now
        const amzExpires = 'X-Amz-Expires=300'

        const imgUrl = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/${fileName}.${fileType}\?${amzId}&${amzDate}&${amzExpires}`
        
        await expect(async () => {
            await when.invoke_getImgPresignedUrl({
                username: undefined,
                url: imgUrl
            })
        }).rejects.toThrow()
    })

    it("When old url is not expired, should return old url", async () => {
        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variables")
            return;
        }
        const fileType = 'jpeg'
        const username = chance.guid();
        const fileName = 'testFile'
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const amzDate = `X-Amz-Date=${nowDateToAmzDate()}` // now
        const amzExpires = 'X-Amz-Expires=300'
        const amzId = 'x-id=GetObject'

        const imgUrl = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/${fileName}.${fileType}\?${amzId}&${amzDate}&${amzExpires}`
        
        // Patterns
        const urlPathPattern = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/.*.${fileType}`
        const urlTokenPattern = `?(?:.*&)`
        const signedUrlPattern = new RegExp(`${urlPathPattern}${urlTokenPattern}`)

        // Tests
        const signedUrl = await when.invoke_getImgPresignedUrl({
            username,
            url: imgUrl
        })

        expect(signedUrl).toMatch(signedUrlPattern);
        expect(signedUrl).toBe(imgUrl)
    })

    it("When old url is expired: should return new signed url", async () => {
        const { BUCKET_NAME, REGION } = process.env;
        if (!BUCKET_NAME || !REGION) {
            console.error("Missing environment variables")
            return;
        }
        const fileType = 'jpeg'
        const username = chance.guid();
        const fileName = 'testFile'
        const s3Host = 's3'
        const awsHost = 'amazonaws.com'
        const amzDate = 'X-Amz-Date=20250814T145404Z' // 20h ago
        const amzExpires = 'X-Amz-Expires=300'
        const amzId = 'x-id=GetObject'

        const imgUrl = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/${fileName}.${fileType}\?${amzId}&${amzDate}&${amzExpires}`
        
        // Patterns
        const urlPathPattern = `https://${BUCKET_NAME}.${s3Host}.${REGION}.${awsHost}/${username}/.*.${fileType}`
        const urlTokenPattern = `?(?:.*&)`
        const signedUrlPattern = new RegExp(`${urlPathPattern}${urlTokenPattern}`)

        const signedUrl = await when.invoke_getImgPresignedUrl({
            username,
            url: imgUrl
        })


        expect(signedUrl).toMatch(signedUrlPattern)

        const { tokens } = getTokensAndFilepath(signedUrl)

        const date = extractTokenValue(tokens, 'X-Amz-Date')
        const expiry = extractTokenValue(tokens, 'X-Amz-Expires')

        expect(expiry).toBe('300');

        const expired = isExpired(date, expiry);

        expect(expired).toBeFalsy();
    })
})
