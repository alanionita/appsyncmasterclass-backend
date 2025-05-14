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
        result.push(chunk);
        return result
    }   
    return result;
}

module.exports = {
    throwWithLabel,
    chunk
}