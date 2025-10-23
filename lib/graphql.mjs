import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import apollo from "@apollo/client";
import { throwWithLabel } from "./utils.js";

const { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } = apollo

export class GraplQLClient {
    #client;
    constructor({ region, appSyncUrl }) {
        const auth = {
            type: "AWS_IAM",
            credentials: () => {
                return {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN
                };
            }
        };

        const httpLink = new HttpLink({
            uri: appSyncUrl
        });

        const config = {
            url: appSyncUrl,
            region,
            auth
        }

        const link = ApolloLink.from([
            createAuthLink(config),
            createSubscriptionHandshakeLink(config, httpLink),
        ]);

        this.#client = new ApolloClient({
            link,
            cache: new InMemoryCache(), // Required
        });
    }



    async notifyRetweeted(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const NOTIFY_RETWEETED = gql`
                mutation notifyRetweeted($id: ID!, $userId: ID!, $tweetId: ID!, $retweetedBy: ID!, $retweetId: ID!) {
                    notifyRetweeted(
                        id: $id
                        userId: $userId
                        tweetId: $tweetId
                        retweetedBy: $retweetedBy
                        retweetId: $retweetId
                    ) {
                        __typename
                        ... on Retweeted {
                            id
                            type
                            userId
                            tweetId
                            retweetedBy
                            retweetId
                            createdAt
                        }
                    }
                }
            `;

            const { data, errors } = await this.#client.mutate({
                mutation: NOTIFY_RETWEETED, 
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.notifyRetweeted
            };
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.notifyRetweeted`)
        }
    }
}