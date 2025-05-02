const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const http = require("axios");
const fs = require("fs");
const { throwWithLabel } = require("../lib/utils");
const { makePresignedUrlGet } = require("../lib/s3");

require('dotenv').config()

const { USERS_TABLE, REGION, BUCKET_NAME, TWEETS_TABLE, TIMELINES_TABLE, RETWEETS_TABLE } = process.env;

async function user_exists(userID) {
    try {
        console.info(`Getting [${userID}] from table [${USERS_TABLE}] `)

        const client = new DynamoDBClient({ region: REGION });

        const input = {
            TableName: USERS_TABLE,
            Key: {
                id: {
                    "S": userID
                }
            }
        };
        const command = new GetItemCommand(input);
        const resp = await client.send(command)

        // Convert to JSON
        const item = unmarshall(resp.Item)
        expect(item).toBeTruthy()
        return item
    } catch (err) {
        console.error('Err [tests/steps/then/user_exists] ::', err.message)
        console.info(JSON.stringify(err))

    }

}

async function user_upload({ uploadUrl, filePath, contentType }) {
    try {
        const response = await http({
            method: 'put',
            url: uploadUrl,
            headers: {
                'Content-Length': fs.statSync(filePath).size,
                "Content-Type": contentType
            },
            data: fs.createReadStream(filePath)
        });
        if (response.status !== 200) {
            throw Error(`Issues with request : ${response.status}`)
        }
        return response;
    } catch (caught) {
        if (caught.response) {
            console.error('Err [then.user_upload] :: Response Error')
            console.info(JSON.stringify(caught.response.data).substring(0, 100));
        }

        if (caught.request) {
            console.error('Err [then.user_upload] :: Request Error')
            console.info(JSON.stringify(caught.request).substring(0, 100))
        }

        return throwWithLabel(caught, "then.user_upload")
    }

}

async function user_download(key) {
    try {
        const downloadUrl = await makePresignedUrlGet({ region: REGION, bucket: BUCKET_NAME, key })
        const response = await http(downloadUrl);
        return response;
    } catch (caught) {
        if (caught.response) {
            console.error('Err [then.user_download] :: Response Error')
            console.info(JSON.stringify(caught.response.data).substring(0, 100));
        }

        if (caught.request) {
            console.error('Err [then.user_download] :: Request Error')
            console.info(JSON.stringify(caught.request).substring(0, 100))
        }

        return throwWithLabel(caught, "then.user_download")
    }
}

async function table_get(tableName, key) {
    try {
        const ddb = new DynamoDBClient({ region: REGION });
        const client = new DynamoDBDocumentClient(ddb)

        if (!tableName) throw Error("Table not found");

        const keyValues = Object.keys(key);

        if (!key || keyValues < 1) throw Error("Missing keys");

        const input = {
            TableName: tableName,
            Key: key
        };
        const command = new GetCommand(input);
        return await client.send(command)
    } catch (caught) {
        return throwWithLabel(caught, "then.table_get")
    }
}

async function TweetsTable_contains(id) {
    try {

        if (!id) throw Error('Invalid key for table')

        if (!TWEETS_TABLE) throw Error("Missing env variable");

        const ddbResp = await table_get(TWEETS_TABLE, {
            id
        });

        expect(ddbResp.Item).toBeTruthy()
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Item
    } catch (caught) {
        return throwWithLabel(caught, "then.TweetsTable_contains")
    }
}

async function TweetsTable_retweets_contains({ author, retweetOf }) {
    try {

        if (!author || !retweetOf) throw Error('Missing fn arguments')

        if (!TWEETS_TABLE) throw Error("Missing env variable");

        const ddb = new DynamoDBClient({ region: REGION });
        const client = new DynamoDBDocumentClient(ddb)

        const input = {
            TableName: TWEETS_TABLE,
            IndexName: 'retweets',
            KeyConditionExpression: "author = :author AND retweetOf = :retweetOf",
            ExpressionAttributeValues: {
                ":author": author,
                ":retweetOf": retweetOf
            },
            Limit: 1
        };
        const command = new QueryCommand(input);

        const ddbResp = await client.send(command)

        expect(ddbResp.Items).toBeTruthy()
        expect(ddbResp.Items.length).toBeGreaterThan(0)
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Items[0]
    } catch (caught) {
        return throwWithLabel(caught, "then.TweetsTableIndex_contains")
    }
}

async function TweetsTable_retweets_notcontains({ author, retweetOf }) {
    try {

        if (!author || !retweetOf) throw Error('Missing fn arguments')

        if (!TWEETS_TABLE) throw Error("Missing env variable");

        const ddb = new DynamoDBClient({ region: REGION });
        const client = new DynamoDBDocumentClient(ddb)

        const input = {
            TableName: TWEETS_TABLE,
            IndexName: 'retweets',
            KeyConditionExpression: "author = :author AND retweetOf = :retweetOf",
            ExpressionAttributeValues: {
                ":author": author,
                ":retweetOf": retweetOf
            },
            Limit: 1
        };
        const command = new QueryCommand(input);

        const ddbResp = await client.send(command)

        expect(ddbResp.Items).toBeDefined();
        expect(ddbResp.Items.length).toBe(0)
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Items
    } catch (caught) {
        return throwWithLabel(caught, "then.TweetsTable_retweets_notcontains")
    }
}

async function TweetsTable_replies_contains({ author, inReplyToTweetId, limit = 15 }) {
    try {

        if (!author || !inReplyToTweetId) throw Error('Missing fn arguments')

        if (!TWEETS_TABLE) throw Error("Missing env variable");

        const ddb = new DynamoDBClient({ region: REGION });
        const client = new DynamoDBDocumentClient(ddb)

        const input = {
            TableName: TWEETS_TABLE,
            IndexName: 'replies',
            KeyConditionExpression: "author = :author AND inReplyToTweetId = :inReplyToTweetId",
            ExpressionAttributeValues: {
                ":author": author,
                ":inReplyToTweetId": inReplyToTweetId
            },
            Limit: limit
        };
        const command = new QueryCommand(input);

        const ddbResp = await client.send(command)

        expect(ddbResp.Items).toBeTruthy()
        expect(ddbResp.Items.length).toBeGreaterThan(0)
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Items
    } catch (caught) {
        return throwWithLabel(caught, "then.TweetsTableIndex_contains")
    }
}

async function get_user_timeline(userId) {
    try {

        if (!userId) throw Error('Invalid key for table')

        if (!TIMELINES_TABLE) throw Error("Missing env variable");

        const ddb = new DynamoDBClient({ region: REGION });
        const client = new DynamoDBDocumentClient(ddb)

        const input = {
            TableName: TIMELINES_TABLE,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            },
            ScanIndexForward: false
        };
        const command = new QueryCommand(input);

        const ddbResp = await client.send(command)

        expect(ddbResp.$metadata.httpStatusCode).toBe(200)
        return ddbResp.Items
    } catch (caught) {
        return throwWithLabel(caught, "then.get_user_timeline")
    }
}

async function RetweetsTable_contains({ userId, tweetId }) {
    try {

        if (!userId || !tweetId) throw Error('Missing fn arguments')

        if (!RETWEETS_TABLE) throw Error("Missing env variable");

        const ddbResp = await table_get(RETWEETS_TABLE, {
            userId,
            tweetId
        });

        expect(ddbResp.Item).toBeTruthy()
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Item
    } catch (caught) {
        return throwWithLabel(caught, "then.RetweetsTable_contains")
    }
}

async function RetweetsTable_notcontains({ userId, tweetId }) {
    try {

        if (!userId || !tweetId) throw Error('Missing fn arguments')

        if (!RETWEETS_TABLE) throw Error("Missing env variable");

        const ddbResp = await table_get(RETWEETS_TABLE, {
            userId,
            tweetId
        });

        expect(ddbResp.Item).toBeFalsy()
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)

        return ddbResp.Item
    } catch (caught) {
        return throwWithLabel(caught, "then.RetweetsTable_contains")
    }
}

async function TimelinesTable_contains(userId, tweetId) {
    try {

        if (!userId || !tweetId) throw Error('Invalid key for table')

        if (!TIMELINES_TABLE) throw Error("Missing env variable");

        const ddbResp = await table_get(TIMELINES_TABLE, {
            userId,
            tweetId
        });

        expect(ddbResp.Item).toBeTruthy()
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)
        return ddbResp.Item
    } catch (caught) {
        return throwWithLabel(caught, "then.TimelinesTable_contains")
    }
}

async function UsersTable_contains(id) {
    try {

        if (!id) throw Error('Invalid key for table')

        if (!USERS_TABLE) throw Error("Missing env variable");

        const ddbResp = await table_get(USERS_TABLE, {
            id
        });

        expect(ddbResp.Item).toBeTruthy()
        expect(ddbResp.$metadata.httpStatusCode).toBe(200)
        return ddbResp.Item
    } catch (caught) {
        return throwWithLabel(caught, "then.UsersTable_contains")
    }
}

module.exports = {
    user_exists,
    user_upload,
    user_download,
    TweetsTable_contains,
    TimelinesTable_contains,
    UsersTable_contains,
    RetweetsTable_contains,
    TweetsTable_retweets_contains,
    get_user_timeline,
    TweetsTable_retweets_notcontains,
    RetweetsTable_notcontains,
    TweetsTable_replies_contains
}