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

module.exports = {
    throwWithLabel,
    chunk
}