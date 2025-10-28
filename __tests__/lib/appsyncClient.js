const { createAuthLink } = require("aws-appsync-auth-link");
const { createSubscriptionHandshakeLink } = require("aws-appsync-subscription-link");
const apollo = require("@apollo/client");
const { throwWithLabel } = require("./utils");

const { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } = apollo

class GraplQLClient {
    #client;
    constructor({ region, appSyncUrl, accessToken }) {
        const auth = {
            type: "AMAZON_COGNITO_USER_POOLS",
            jwtToken: accessToken
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

    /**
     * Triggers Subscribe.onNotified with payload
     * @param {Object} variables - The notifyRetweeted() query params
     * @param {String} variables.userId - userId for the notifications
     * @returns {Promise<Notification>} async Notification type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async onNotified(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const ON_NOTIFIED = gql`
                subscription onNotified($userId: ID!) {
                    onNotified(
                        userId: $userId
                    ) {
                        ... on iNotification {
                            id
                            type
                            userId
                            createdAt
                        }
                    
                        ... on Retweeted {
                            tweetId
                            retweetedBy
                            retweetId
                        }
                    }
                }
            `;

            const observable = this.#client.subscribe({
                query: ON_NOTIFIED,
                variables,
                errorPolicy: 'all'
            })

            return observable
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.onNotified`)
        }
    }
}

module.exports = {
    GraplQLClient
}