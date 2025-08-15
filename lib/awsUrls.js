const { parseISO, addSeconds, differenceInSeconds, } = require('date-fns');

function extractTokenValue(tokensStr, key) {
    try {
        if (!tokensStr || tokensStr.length == 0 || !key || key.length == 0) {
            throw Error("Missing required argument: tokensStr, key")
        }

        const tokens = tokensStr.split('&')

        const filter = tokens.filter(tokenStr => tokenStr.includes(key))

        let tokenValue;

        if (filter[0]) {
            const [k, v] = filter[0].split('=');
            tokenValue = v
        }

        return tokenValue
    } catch (err) {
        console.error("Err [extractTokenValue] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
};

function getTokensAndFilepath(url) {
    const [path, tokens] = url.split('?')
    const [__, filePath] = path.split('.amazonaws.com/') // $USER_ID/$FILE_ID.$ext

    return {
        tokens,
        filePath
    }
}

function isExpired(date, expiry) {
    try {
        if (!date || !expiry) {
            throw Error("Missing required argument: date, expiry")
        }

        const dateObj = parseISO(date);
        const expiryObj = addSeconds(dateObj, expiry);

        const difference = differenceInSeconds(expiryObj, Date.now())

        return difference < 0
    } catch (err) {
        console.error("Err [isExpired] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
};

function nowDateToAmzDate() {
    const isoNow = formatISO(Date.now(), { format: 'basic' });
    const [date, tz] = isoNow.split('+')

    return date + 'Z'; // return to Zulu time
}

module.exports = {
    extractTokenValue,
    getTokensAndFilepath,
    isExpired,
    nowDateToAmzDate
}
