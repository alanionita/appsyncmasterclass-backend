export function genNextToken(searchParams) {
    if (!searchParams) {
        return null
    }

    const payload = Object.assign(
        {}, searchParams, { random: chance.string({ length: 16 }) })
    const token = JSON.stringify(payload)
    return Buffer.from(token).toString('base64')
}

export function parseNextToken(nextToken) {
    if (!nextToken) {
        return undefined
    }

    const token = Buffer.from(nextToken, 'base64').toString()
    const searchParams = JSON.parse(token)
    delete searchParams.random

    return searchParams
}