const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function makePresignedUrlGet({ region, bucket, key }) {
    try {
        if (!region || !bucket || !key) {
            throw Error("Missing argument: region, bucket, key")
        }

        const client = new S3Client({ region });
        const expiresIn = 60; // seconds, 1m
        const cmd = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        // Get Signed URL
        return await getSignedUrl(client, cmd, { expiresIn });
    } catch (err) {
        console.error("Err [makePresignedUrlGet] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
};

module.exports = {
    makePresignedUrlGet
}