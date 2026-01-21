import { GetGraphqlApiCommand, AppSyncClient, UpdateGraphqlApiCommand } from "@aws-sdk/client-appsync";

export function initClient(region = null) {
    try {
        if (!region) {
            throw Error("Missing region")
        }
        const client = new AppSyncClient({ region });

        return client && client
    } catch (err) {
        console.error("Err [setLogLevel/initClient] ::", err.message)
        console.info(JSON.stringify(err.stack))
    }
}

export async function findGraphQLApi(_client = null, apiId = null) {
    try {
        if (!_client) {
            throw Error("Missing client")
        }

        if (!apiId) {
            throw Error("Missing apiId")
        }
        
        const cmdGetApi = new GetGraphqlApiCommand({ apiId });

        const resp = await _client.send(cmdGetApi);

        if (resp.$metadata.httpStatusCode !== 200) {
            throw new Error('Err [GetGraphqlApiCommand] :', { cause: resp })
        }

        return resp.graphqlApi
    } catch (err) {
        console.error("Err [setLogLevel/findGraphQLApi] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}


async function updateFieldLogLevel({
    _client = null,
    graphQLApi = null,
    fieldLogLevel = 'ERROR'
}) {
    try {
        if (!_client) {
            throw Error("Missing _client")
        }

        if (!graphQLApi) {
            throw Error("Missing graphQLApi")
        }

        const inputUpdateApi = { // UpdateApiRequest
            apiId: graphQLApi.apiId, // required
            name: graphQLApi.name, // required
            authenticationType: graphQLApi.authenticationType, // required
            logConfig: { // EventLogConfig
                fieldLogLevel,
                cloudWatchLogsRoleArn: graphQLApi.logConfig.cloudWatchLogsRoleArn, // required
                // excludeVerboseContent: // optional
            },
            userPoolConfig: { // required if you pass .authenticationType
                ...graphQLApi.userPoolConfig
            }
        };

        const cmdUpdateApi = new UpdateGraphqlApiCommand(inputUpdateApi);
        const resp = await _client.send(cmdUpdateApi);

        if (resp.$metadata.httpStatusCode !== 200) {
            throw new Error('Err [UpdateGraphqlApiCommand] :', { cause: respGetApi })
        }
    } catch (err) {
        console.error("Err [setLogLevel/updateFieldLogLevel] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}

export async function handler() {
    const { REGION, APPSYNC_API_ID, FIELD_LOG_LEVEL } = process.env;
    try {
        if (!APPSYNC_API_ID || !FIELD_LOG_LEVEL || !REGION) {
            throw Error("Missing environment variables")
        }

        const appsyncClient = initClient(REGION);

        const graphQLApi = await findGraphQLApi(appsyncClient, APPSYNC_API_ID);

        await updateFieldLogLevel({
            _client: appsyncClient,
            graphQLApi,
            fieldLogLevel: FIELD_LOG_LEVEL
        })
    } catch (err) {
        console.error("Err [setLogLevel] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}