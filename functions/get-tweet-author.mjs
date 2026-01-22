import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import Xray from 'aws-xray-sdk'

export async function handler(payloads) {
    try {
        const { USERS_TABLE, REGION } = process.env;
        if (!USERS_TABLE || !REGION) {
            throw Error("Missing environment variables")
        }

        const _dynamoClient = new DynamoDBClient({ region: REGION });
        const ddb = Xray.captureAWSv3Client(_dynamoClient);
        const client = DynamoDBDocumentClient.from(ddb);
        const userIds = payloads.map(x => x.userId)
        const callers = payloads.map(x => x.caller)
        const selectionPerUser = payloads.map(x => x.selection)

        /**
         * @typedef {Object} Profile
         * @property {string} id
         * @property {string} __typename // "MyProfile" || "OtherProfile"
         * @property {Array} selection // GraphQL query selection
        */

        /** @type {Set<Profile>} */
        const profilesSet = new Set()

        userIds.forEach((userId, index) => {
            if (!profilesSet.has({ id: userId })) {

                const profileType = userId === callers[index] ? "MyProfile" : "OtherProfile"

                profilesSet.add({
                    id: userId,
                    __typename: profileType,
                    selection: selectionPerUser[index]
                })
            }
        })


        const parsedProfiles = [...profilesSet];

        const input = {
            RequestItems: {
                [USERS_TABLE]: {
                    Keys: parsedProfiles.map(({ id }) => ({ id }))
                }
            }
        };

        const command = new BatchGetCommand(input);
        const batchGetResp = await client.send(command)
        if (batchGetResp.$metadata.httpStatusCode !== 200) {
            console.info('BatchGetCommand ::', batchGetResp)
            throw Error('Problems with BatchGetCommand')
        }

        const users = batchGetResp.Responses[USERS_TABLE]
        const output = parsedProfiles.map((profile) => {
            const foundUser = users.filter(({ id }) => profile.id === id)[0];
            if (!foundUser) return { 
                errorType: 'UserNotFound', 
                errorMessage: 'User is not found.' 
            }

            const { id, __typename, selection } = profile

            if (selection.length === 1 && selection[0] === 'id') {
                return {
                    data: { id, __typename }
                }
            }

            return { 
                data: Object.assign({}, { id, __typename }, foundUser)
            }
        })

        return output;
    } catch (err) {
        console.error("Err [get-tweet-author] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}