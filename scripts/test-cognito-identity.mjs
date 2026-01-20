import dotenv from 'dotenv';
import * as path from 'path';
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { FirehoseClient, PutRecordCommand } from "@aws-sdk/client-firehose";

const __dirname = import.meta.dirname;

dotenv.config({ path: path.resolve(__dirname, '../.env'), })

async function putFirehoseRecords(creds = null) {
    try {
        const streamName = process.env.FIREHOSE_STREAM_NAME
        const region = process.env.REGION

        if (!streamName) throw Error('Missing Firehose Stream Name')

        if (!creds) throw Error('Missing credentials')

        if (!region) throw Error('Missing region')

        const config = {
            region,
            credentials: {
                ...creds
            }
        }; // type is FirehoseClientConfig
        const client = new FirehoseClient(config);
        const input = { // PutRecordInput
            DeliveryStreamName: streamName, // required
            Record: { // Record
                Data: JSON.stringify({
                    eventType: 'impression',
                    tweetId: '123'
                })
            },
        };
        const command = new PutRecordCommand(input);
        const res = await client.send(command);
        if (res && res.$metadata.httpStatusCode === 200) {
            console.info('Success!')
            console.info('RecordId : ', res.RecordId)
        }
    } catch (err) {
        console.error('Err (test-cognito-identity/putFirehoseRecords) :', err.message)
        console.info(JSON.stringify(err))
    }
}

async function handler() {
    try {

        const providerName = process.env.COGNITO_USER_POOL_PROVIDER_NAME;
        const poolId = process.env.COGNITO_IDENTITY_POOL_ID
        const idToken = process.env.COGNITO_ID_TOKEN
        const region = process.env.REGION

        // NOTE: Source a valid idToken from the AWS Console
        // - Navigate to Appsync
        // - Login with a valid user
        // - Open browser developer tools and go to Local Storage tab
        //     - Hint: It's easier to discern the latest idToken if you first clear the Local Storage
        // - copy the *idToken value to your local .env property

        if (!idToken) throw Error('Missing ID token')

        if (!providerName && !poolId && !region) throw Error('Missing params ', { providerName, poolId, region })


        let loginData = {
            [providerName]: idToken,
        };

        const getCreds = fromCognitoIdentityPool({
            clientConfig: { region }, // Configure the underlying CognitoIdentityClient.
            identityPoolId: poolId,
            logins: loginData
        })

        const creds = await getCreds();

        await putFirehoseRecords(creds)

    } catch (err) {
        if (err.$metadata.httpStatusCode) {
            console.error('AWS Err (@aws-sdk/*) / name :', err.name);
            console.error('AWS Err (@aws-sdk/*) / message :', err.message);
            return;
        }
        console.error(err.message)
        console.info(JSON.stringify(err))

    }
}

await handler();