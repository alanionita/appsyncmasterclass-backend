import Chance from 'chance'
import ssm from '@middy/ssm'
import middy from '@middy/core'
import { initTweetsIndex, initUsersIndex } from "../lib/algolia.mjs"

const { STAGE } = process.env;
const chance = new Chance();

const SearchMode = {
    top: "Top",
    latest: "Latest",
    people: "People",
    photos: "Photos",
    video: "Videos"
}

function genNextToken(searchParams) {
    if (!searchParams) {
        return null
    }

    const payload = Object.assign(
        {}, searchParams, { random: chance.string({ length: 16 }) })
    const token = JSON.stringify(payload)
    return Buffer.from(token).toString('base64')
}

function parseNextToken(nextToken) {
    if (!nextToken) {
        return undefined
    }

    const token = Buffer.from(nextToken, 'base64').toString()
    const searchParams = JSON.parse(token)
    delete searchParams.random

    return searchParams
}

async function searchUsers({ context, userId, query, limit = 10, nextToken }) {
    try {
        const { ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY } = context;

        if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_KEY) {
            throw Error("Missing context variables")
        }

        if (!userId || !query) {
            throw Error("Missing required inputs")
        }


        const searchParams = parseNextToken(nextToken) || {
            query,
            hitsPerPage: limit,
            page: 0
        }

        const usersIndex = await initUsersIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRITE_KEY,
            stage: STAGE
        })

        const results = await usersIndex.search(searchParams)

        const { hits, page, nbPages } = results


        hits.forEach(x => {
            x.__typename = x.id === userId ? 'MyProfile' : 'OtherProfile'
        })

        let nextSearchParams
        if (page + 1 >= nbPages) {
            nextSearchParams = null
        } else {
            nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
        }

        return {
            results: hits,
            nextToken: genNextToken(nextSearchParams)
        }
    } catch (err) {
        console.error('Err (searchLambda/searchUsers) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

async function searchTweets({ context, query, limit = 10, nextToken }) {
    try {
        const { ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY } = context;

        if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_KEY) {
            throw Error("Missing context variables")
        }

        const searchParams = parseNextToken(nextToken) || {
            query,
            hitsPerPage: limit,
            page: 0
        }

        const tweetsIndex = await initTweetsIndex({
            appID: ALGOLIA_APP_ID,
            apiKey: ALGOLIA_WRITE_KEY,
            stage: STAGE
        })

        const results = await tweetsIndex.search(searchParams)

        const { hits, page, nbPages } = results

        let nextSearchParams
        if (page + 1 >= nbPages) {
            nextSearchParams = null
        } else {
            nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
        }

        return {
            results: hits,
            nextToken: genNextToken(nextSearchParams)
        }
    } catch (err) {
        console.error('Err (searchLambda/searchTweets) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

async function lambdaHandler(event, context) {
    try {
        if (!STAGE) {
            throw Error("Missing environment variables")
        }

        const { query, mode, limit, nextToken } = event.arguments;

        if (!query || !mode || !limit) {
            throw Error("Missing required arguments")
        }

        const userId = event.identity.username

        switch (mode) {
            case SearchMode.people:
                return await searchUsers({ context, userId, query, limit, nextToken })
            case SearchMode.latest:
                return await searchTweets({ context, query, limit, nextToken })
            default:
                throw Error("Unsupported search mode")
        }
    } catch (err) {
        console.error("Err [search] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

export const handler = middy()
    .use(
        ssm({
            fetchData: {
                ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
                ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
            },
            setToContext: true,
            cacheExpiry: 5 * 60 * 1000, // 5 mins
        })
    )
    .handler(lambdaHandler)
