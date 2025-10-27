function throwWithLabel(err, funcName) {
    console.error(`Err [${funcName}] ::`, err.message)
    console.info(JSON.stringify(err.stack))
    return err
}

function chunk(items, size) {
    const result = [];
    let chunk = [];
    let chunkStart = 0;
    let chunkEnd = chunkStart + (size - 1);

    if (items.length < size) {
        for (let i = 0; i < items.length; i++) {
            chunk.push(items[i]);
        }
        result.push(chunk);
    }

    if (items.length > size) {
        for (let i = 0; i < items.length; i++) {
            if (i < chunkEnd) {
                chunk.push(items[i]);
            }
            if (i === chunkEnd) {
                chunk.push(items[i]);
                chunkStart = chunkEnd + 1;
                chunkEnd += size
                result.push(chunk);
                chunk = [];
            }
        }
    }
    return result;
}

function extractHashtags(tweetText) {
    const tags = new Set();

    const pattern = new RegExp(/(#\w+\b)/g);
    const matches = tweetText.matchAll(pattern)
    
    for (const tag of matches) {
        if (!tags.has(tag[0])) {
            tags.add(tag[0])
        }
    }

    return tags.size ? [...tags] : null
}

function extractMentions(tweetText) {
    const tags = new Set();

    const pattern = new RegExp(/(@\w+\b)/g);
    const matches = tweetText.matchAll(pattern)
    
    for (const tag of matches) {
        if (!tags.has(tag[0])) {
            tags.add(tag[0])
        }
    }

    return tags.size ? [...tags] : null
}

module.exports = {
    throwWithLabel,
    chunk,
    extractHashtags,
    extractMentions
}