const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const ulid = require('ulid');

function makePresignedUrlPut({ region, bucket, key, contentType }) {
    try {
        if (!region || !bucket || !key || !contentType) {
            throw Error("Missing required argument: region, bucket, key, contentType")
        }
        const client = new S3Client({ region});
        const expiresIn = 60; // seconds, 1m

        // Get Signed URL
        const cmdPutObject = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ACL: 'private'
        });
        return getSignedUrl(client, cmdPutObject, { expiresIn });
    } catch (err) {
        console.error("Err [makePresignedUrlPut] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
};

module.exports.handler = async (event) => {
    try {
        const contentTypeDefault = 'image/jpeg';
        const contentTypePrefix = 'image/';
        const envVars = ["REGION", "BUCKET_NAME"];

        envVars.forEach((v) => {
            const processV = process.env[v];
            if (!processV || processV.length === 0) {
                throw Error("Missing var : " + v)
            }
            return;
        })
        
        if (!event.identity.username) {
            throw Error("Incorrect event type")
        }

        if (!event.arguments.extension) {
            throw Error("Missing event argument : extension")
        }
        
        const { REGION, BUCKET_NAME } = process.env;
        const id = ulid.ulid();
        const extension = event.arguments.extension

        const key = `${event.identity.username}/${id}`

        const keyExt = extension && extension.startsWith('.') ? `${key}${extension}` : `${key}.${extension}`

        const contentType = event.arguments.contentType || contentTypeDefault

        if (!contentType.startsWith(contentTypePrefix)) {
            throw new Error('ContentType should be an image')
        }

        const signedUrl = makePresignedUrlPut({
            region: REGION,
            bucket: BUCKET_NAME,
            key: keyExt,
            contentType
        })

        return signedUrl;
    } catch (err) {
        console.error("Err [get-img-upload-url] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
        throw err;
    }
}