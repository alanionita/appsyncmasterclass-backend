const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const awsUrlsLib = require("../lib/awsUrls");

const { REGION, BUCKET_NAME } = process.env;

function makePresignedUrlGet({ region, bucket, filePath }) {
    try {
        if (!region || !bucket) {
            throw Error("Missing required argument: region, bucket, contentType")
        }
        const client = new S3Client({ region });
        const expiresIn = 300; // seconds, 5m

        // Get Signed URL
        const cmdPutObject = new GetObjectCommand({
            Bucket: bucket,
            Key: filePath,
            ACL: 'private'
        });
        return getSignedUrl(client, cmdPutObject, { expiresIn });
    } catch (err) {
        console.error("Err [makePresignedUrlGet] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
};

module.exports.handler = async (event) => {
    try {
        if (!BUCKET_NAME || !REGION) {
            throw Error("Missing environment variables")
        }

        if (!event.identity.username) {
            throw Error("Unexpected event type")
        }

        const { imgUrl } = event.source

        if (!imgUrl || imgUrl.length === 0) return null;

        const { tokens, filePath } = awsUrlsLib.getTokensAndFilepath(imgUrl)
        const validGetId = 'GetObject';
        const getId = awsUrlsLib.extractTokenValue(tokens, 'x-id')

        if (getId !== validGetId) {
            throw Error('Unexpected x-id, must be a GetObject url')
        }

        const date = awsUrlsLib.extractTokenValue(tokens, 'X-Amz-Date')
        const expiry = awsUrlsLib.extractTokenValue(tokens, 'X-Amz-Expires')

        if (!date || !expiry) {
            throw Error('Unexpected url shape, must contain valid X-Amz-* date and expiry headers')
        }

        const expired = awsUrlsLib.isExpired(date, expiry);

        if (expired) {
            const signedUrl = makePresignedUrlGet({
                region: REGION,
                bucket: BUCKET_NAME,
                filePath,
            })
            return signedUrl;
        } else {
            return imgUrl;
        }
    } catch (err) {
        console.error("Err [get-img-upload-url] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
        throw err;
    }
}