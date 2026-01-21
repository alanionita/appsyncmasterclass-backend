const dotenv = require("dotenv")
const retry = require('async-retry');
describe('When setLogLevelAll runs', () => {
    it("Updates GraphQLApi.logLevel to ALL", async () => {
        const { findGraphQLApi, initClient, handler } = await import("../../../../functions/set-log-level.mjs")
        dotenv.config({ path: `__tests__/cases/integration/set-log-level/.env.ALL` })

        await handler();

        await retry(async () => {
            const appsyncClient = initClient(process.env.REGION);

            const graphQLApi = await findGraphQLApi(appsyncClient, process.env.APPSYNC_API_ID)

            expect(graphQLApi.logConfig.fieldLogLevel).toBe('ALL')
        }, {
            retries: 3,
            maxTimeout: 1000
        })
    }),
        it("Updates GraphQLApi.logLevel to ERROR", async () => {
            const { findGraphQLApi, initClient, handler } = await import("../../../../functions/set-log-level.mjs")
            dotenv.config({
                path: `__tests__/cases/integration/set-log-level/.env.ERROR`,
                override: true
            })

            await handler();

            await retry(async () => {
                const appsyncClient = initClient(process.env.REGION);

                const graphQLApi = await findGraphQLApi(appsyncClient, process.env.APPSYNC_API_ID)

                expect(graphQLApi.logConfig.fieldLogLevel).toBe('ERROR')
            }, {
                retries: 3,
                maxTimeout: 1000
            })
        })

})