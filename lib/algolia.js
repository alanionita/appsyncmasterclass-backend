import { algoliasearch } from 'algoliasearch';


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
        console.err('Err (util/algolia/saveObjects) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
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
        console.err('Err (util/algolia/deleteObjects) :', err.message)
        console.info('Err details) :', JSON.stringify(err))
    }
}

export async function initUsersIndex({ appID, apiKey, stage = 'dev' }) {
    if (!appID || !apiKey) {
        throw Error("Missing required credentials")
    }
    if (!usersClient) {
        usersClient = algoliasearch(appID, apiKey);
    }
    const USERS_INDEX = `users_${stage}`

    await usersClient.setSettings({
        indexName: USERS_INDEX,
        searchableAttributes: [
            "name", "screenName"
        ]
    });


    return {
        client: usersClient,
        saveObjects: async (objects) => {
            return await saveObjects(usersClient, USERS_INDEX, objects)
        },
        deleteObjects: async (ids) => {
            return await deleteObjects(usersClient, USERS_INDEX, ids)
        }
    }
        ;
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
        searchableAttributes: [
            "text"
        ],
        customRanking: [
            "desc(createdAt)"
        ]
    });

    return {
        client: tweetsClient,
        saveObjects: async (objects) => {
            return await saveObjects(tweetsClient, TWEETS_INDEX, objects)
        },
        deleteObjects: async (ids) => {
            return await deleteObjects(tweetsClient, TWEETS_INDEX, ids)
        }
    };
}
