const { createAuthLink } = require("aws-appsync-auth-link");
const { createSubscriptionHandshakeLink } = require("aws-appsync-subscription-link");
const apollo = require("@apollo/client");
const { throwWithLabel } = require("./utils");
const { otherProfileFrag, tweetFrag, iProfileFrag, iTweetFrag, replyFrag, retweetFrag, myProfileFrag } = require('./utils/graphqlFragments')

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
                            profile {
                                ... on MyProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                }
                                ... on OtherProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                } 
                            }
                        }

                        ... on Liked {
                            tweetId
                            likedBy
                            profile {
                                ... on MyProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                }
                                ... on OtherProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                } 
                            }
                        }

                        ... on Replied {
                            tweetId
                            replyTweetId
                            repliedBy
                            profile {
                                ... on MyProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                }
                                ... on OtherProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                } 
                            }
                        }

                        ... on Mentioned {
                            mentionedBy
                            mentionedByTweetId
                            profile {
                                ... on MyProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                }
                                ... on OtherProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                } 
                            }
                        }

                        ... on DMed {
                            otherUserId
                            message
                            profile {
                                ... on MyProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                }
                                ... on OtherProfile {
                                    id
                                    name
                                    screenName
                                    imgUrl
                                } 
                            }
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

    /**
     * Triggers Mutation.sendDirectMessage with payload
     * @param {Object} variables - The sendDirectMessage() query params
     * @param {String} variables.otherUserId - message destination user
     * @param {String} variables.message - message content
     * @returns {Promise<Conversation>} async Conversation type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async sendDirectMessage(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const SEND_DIRECT_MESSAGE = gql`
                mutation sendDirectMessage($otherUserId: ID!, $message: String!) {
                    sendDirectMessage(
                        otherUserId: $otherUserId,
                        message: $message
                    ) {
                        id
                        lastMessage
                        lastModified
                        otherUser {
                            ... otherProfileFields
                            tweets {
                                nextToken
                                tweets {
                                    ... iTweetFields
                                }
                            }
                        }
                    }
                }
                ${otherProfileFrag},
                ${tweetFrag},
                ${iTweetFrag},
                ${iProfileFrag},
                ${retweetFrag},
                ${replyFrag},
                ${myProfileFrag}
            `;

            const { data, errors } = await this.#client.mutate({
                mutation: SEND_DIRECT_MESSAGE,
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.sendDirectMessage
            };

        } catch (caught) {
            throwWithLabel(caught, `GraphQL.sendDirectMessage`)
        }
    }

    /**
     * Triggers Query.listConversations with payload
     * @param {Object} variables - The listConversations() query params
     * @param {String} variables.limit - max 25
     * @param {String} variables.nextToken - optional string value
     * @returns {Promise<ConversationPage>} async ConversationPage type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async listConversations(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const LIST_CONVERSATIONS = gql`
                query listConversations($limit: Int!, $nextToken: String) {
                    listConversations(
                        limit: $limit,
                        nextToken: $nextToken
                    ) {
                        nextToken
                        conversations {
                            id
                            lastMessage
                            lastModified
                            otherUser {
                                ... otherProfileFields
                                tweets {
                                    nextToken
                                    tweets {
                                        ... iTweetFields
                                    }
                                }
                            }
                        }
                    }
                }
                ${otherProfileFrag},
                ${tweetFrag},
                ${iTweetFrag},
                ${iProfileFrag},
                ${retweetFrag},
                ${replyFrag},
                ${myProfileFrag}
            `;

            const { data, errors } = await this.#client.query({
                query: LIST_CONVERSATIONS,
                variables,
                errorPolicy: 'all'
            })
            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.listConversations
            };

        } catch (caught) {
            throwWithLabel(caught, `GraphQL.listConversations`)
        }
    }

    /**
     * Triggers Query.getDirectMessages with payload
     * @param {Object} variables - The getDirectMessages() query params
     * @param {String} variables.otherUserId - the correspondent 
     * @param {String} variables.limit - max 25
     * @param {String} variables.nextToken - optional string value
     * @returns {Promise<MessagesPage>} async MessagesPage type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async getDirectMessages(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const GET_DMS = gql`
                query getDirectMessages($otherUserId: ID!, $limit: Int!, $nextToken: String) {
                    getDirectMessages(
                        otherUserId: $otherUserId
                        limit: $limit,
                        nextToken: $nextToken
                    ) {
                        nextToken
                        messages {
                            messageId
                            message
                            timestamp
                            from {
                                ... otherProfileFields
                                ... myProfileFields
                                tweets {
                                    nextToken
                                    tweets {
                                        ... iTweetFields
                                    }
                                }
                            }
                        }
                    }
                }
                ${otherProfileFrag},
                ${myProfileFrag},
                ${iProfileFrag},
                ${tweetFrag},
                ${retweetFrag},
                ${replyFrag},
                ${iTweetFrag},
            `;

            const { data, errors } = await this.#client.query({
                query: GET_DMS,
                variables,
                errorPolicy: 'all'
            })
            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.getDirectMessages
            };

        } catch (caught) {
            throwWithLabel(caught, `GraphQL.getDirectMessages`)
        }
    }
}

module.exports = {
    GraplQLClient
}