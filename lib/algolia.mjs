import { algoliasearch } from 'algoliasearch'

let usersClient = null;
let tweetsClient = null;

async function saveObjects(algoliaClient, index, objects) {
    try {
        if (!objects || !Array.isArray(objects)) {
            throw Error("Incorrect formatting or missing input")
        }
        return await algoliaClient.saveObjects({
            indexName: index,
            waitForTasks: false,
            batchSize: 1000,
            objects
        });

    } catch (err) {
        console.error('Err (lib/algolia/saveObjects) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

async function deleteObjects(algoliaClient, index, ids) {
    try {
        if (!ids || !Array.isArray(ids)) {
            throw Error("Incorrect formatting or missing input")
        }

        return await algoliaClient.deleteObjects({
            indexName: index,
            objectIDs: ids,
        });

    } catch (err) {
        console.error('Err (lib/algolia/deleteObjects) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

async function search(algoliaClient, index, query, hitsPerPage = 10, page = 0) {
    try {
        if (!algoliaClient || !index || !query) {
            throw Error("Missing required inputs")
        }

        const response = await algoliaClient.searchSingleIndex({
            indexName: index,
            searchParams: {
                query,
                hitsPerPage,
                page
            }
        });

        return response
    } catch (err) {
        console.error('Err (lib/algolia/search) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

async function searchFacet({ client, index, query, facetName, hitsPerPage = 10, page = 0 }) {
    try {
        if (!client || !index || !query || !facetName) {
            throw Error("Missing required inputs")
        }

        const response = await client.searchSingleIndex({
            indexName: index,
            searchParams: { 
                hitsPerPage,
                page,
                facetFilters: [`${facetName}:${query}`] 
            },
        })

        return response
    } catch (err) {
        console.error('Err (lib/algolia/searchFacet) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

export async function initUsersIndex({ appID, apiKey, stage = 'dev' }) {
    try {

        if (!appID || !apiKey) {
            throw Error("Missing required credentials")
        }
        if (!usersClient) {
            usersClient = algoliasearch(appID, apiKey);
        }
        const USERS_INDEX = `users_${stage}`

        await usersClient.setSettings({
            indexName: USERS_INDEX,
            indexSettings: {
                searchableAttributes: [
                    "name", "screenName", "bio"
                ]
            }
        });


        return {
            client: usersClient,
            saveObjects: async (objects) => {
                return await saveObjects(usersClient, USERS_INDEX, objects)
            },
            deleteObjects: async (ids) => {
                return await deleteObjects(usersClient, USERS_INDEX, ids)
            },
            search: async ({ query, hitsPerPage, page }) => {
                return await search(usersClient, USERS_INDEX, query, hitsPerPage, page)
            }
        }
    } catch (err) {
        console.error('Err (lib/algolia/initUsersIndex) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
        return err
    }
}

export async function initTweetsIndex({ appID, apiKey, stage = 'dev' }) {
    if (!appID || !apiKey) {
        throw Error("Missing required credentials")
    }
    if (!tweetsClient) {
        tweetsClient = algoliasearch(appID, apiKey);
    }
    const TWEETS_INDEX = `tweets_${stage}`

    await tweetsClient.setSettings({
        indexName: TWEETS_INDEX,
        indexSettings: {
            searchableAttributes: [
                "text"
            ],
            customRanking: [
                "desc(createdAt)"
            ],
            attributesForFaceting: [
                "searchable(hashtags)"
            ]
        }
    });

    return {
        client: tweetsClient,
        saveObjects: async (objects) => {
            return await saveObjects(tweetsClient, TWEETS_INDEX, objects)
        },
        deleteObjects: async (ids) => {
            return await deleteObjects(tweetsClient, TWEETS_INDEX, ids)
        },
        search: async ({ query, hitsPerPage, page }) => {
            return await search(tweetsClient, TWEETS_INDEX, query, hitsPerPage, page)
        },
        searchByFacet: async ({ query, hitsPerPage, page, facetName }) => {
            return await searchFacet({
                client: tweetsClient,
                index: TWEETS_INDEX,
                query,
                facetName,
                hitsPerPage,
                page
            })
        },
    };
}
