export function throwWithLabel(err, funcName) {
    console.error(`Err [${funcName}] ::`, err.message)
    console.info(JSON.stringify(err.stack))
    return err
}

