function fetchDatePattern() {
    const datePattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g;
    return datePattern
}

function makeSignedUrlPattern({ bucket, username, fileType }) {
    const s3Host = 's3-accelerate'
    const awsHost = 'amazonaws.com'
    const signedUrlPattern = new RegExp(`https://${bucket}.${s3Host}.${awsHost}/${username}/.*\.${fileType}\?.*`)
    return signedUrlPattern
}

function makeExtContentType(fileType) {
    if (!fileType) return null;
    const extension = `.${fileType}`;
    const contentType = `image/${fileType}`;
    return {
        extension,
        contentType
    }
}

function throwWithLabel(err, funcName) {
    console.error(`Err [${funcName}] ::`, err.message)
    console.info(JSON.stringify(err.stack))
    return err
}

async function waitSec(amount = 1) {
    const sec = 1000;
    return new Promise(resolve => setTimeout(resolve, sec * amount));
}

module.exports = {
    fetchDatePattern,
    makeSignedUrlPattern,
    makeExtContentType,
    throwWithLabel,
    waitSec
}