import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { ApolloClient, ApolloLink, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { throwWithLabel } from "./utils.js";

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

    /**
     * Triggers Mutation.notifyRetweeted with payload
     * @param {Object} variables - The notifyRetweeted() query params
     * @param {String} variables.id - id of the notification
     * @param {String} variables.userId - user id of retweeted tweet author
     * @param {Object} variables.tweetId - tweet id of retweeted tweet
     * @param {String} variables.retweetId - retweet id
     * @param {Object} variables.retweetedBy - user id of retweet author
     * @returns {Promise<Retweeted>} async Notification:Retweeted type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

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

    /**
     * Triggers Mutation.notifyLiked with payload
     * @param {Object} variables - The notifyLiked() query params
     * @param {String} variables.id - id of the notification
     * @param {String} variables.userId - user id of liked tweet author
     * @param {Object} variables.tweetId - tweet id of liked tweet
     * @param {Object} variables.likedBy - user id of like author
     * @returns {Promise<Liked>} async Notification:Liked type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async notifyLiked(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const NOTIFY_LIKED = gql`
                mutation notifyLiked($id: ID!, $userId: ID!, $tweetId: ID!, $likedBy: ID!) {
                    notifyLiked(
                        id: $id
                        userId: $userId
                        tweetId: $tweetId
                        likedBy: $likedBy
                    ) {
                        __typename
                        ... on Liked {
                            id
                            type
                            userId
                            tweetId
                            likedBy
                            createdAt
                        }
                    }
                }
            `;

            const { data, errors } = await this.#client.mutate({
                mutation: NOTIFY_LIKED, 
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.notifyLiked
            };
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.notifyLiked`)
        }
    }

    /**
     * Triggers Mutation.notifyMentioned with payload
     * @param {Object} variables - The notifyMentioned() query params
     * @param {String} variables.id - id of the notification
     * @param {String} variables.userId - user id of mentioned tweet author
     * @param {Object} variables.mentionedBy - user id of mention author
     * @param {Object} variables.mentionedByTweetId - tweet id of mention tweet
     * @returns {Promise<Mentioned>} async Notification:Mentioned type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async notifyMentioned(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const NOTIFY_MENTIONED = gql`
                mutation notifyMentioned($id: ID!, $userId: ID!, $mentionedBy: ID!, $mentionedByTweetId: ID!) {
                    notifyMentioned(
                        id: $id
                        userId: $userId
                        mentionedBy: $mentionedBy
                        mentionedByTweetId: $mentionedByTweetId
                    ) {
                        __typename
                        ... on Mentioned {
                            id
                            type
                            userId
                            mentionedBy
                            mentionedByTweetId
                            createdAt
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

            const { data, errors } = await this.#client.mutate({
                mutation: NOTIFY_MENTIONED, 
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.notifyMentioned
            };
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.notifyMentioned`)
        }
    }

    /**
     * Triggers Mutation.notifyReplied with payload
     * @param {Object} variables - The notifyReplied() query params
     * @param {String} variables.id - id of the notification
     * @param {String} variables.userId - user id of mentioned tweet author
     * @param {Object} variables.mentionedBy - user id of mention author
     * @param {Object} variables.mentionedByTweetId - tweet id of mention tweet
     * @returns {Promise<Mentioned>} async Notification:Mentioned type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async notifyReplied(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const NOTIFY_REPLIED = gql`
                mutation notifyReplied($id: ID!, $userId: ID!, $tweetId: ID!, $replyTweetId: ID!, $repliedBy: ID!) {
                    notifyReplied(
                        id: $id
                        userId: $userId
                        tweetId: $tweetId
                        replyTweetId: $replyTweetId
                        repliedBy: $repliedBy
                    ) {
                        __typename
                        ... on Replied {
                            id
                            type
                            userId
                            tweetId
                            replyTweetId
                            repliedBy
                            createdAt
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

            const { data, errors } = await this.#client.mutate({
                mutation: NOTIFY_REPLIED, 
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.notifyReplied
            };
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.notifyReplied`)
        }
    }

    /**
     * Triggers Mutation.notifyDMed with payload
     * @param {Object} variables - The notifyDMed() query params
     * @param {String} variables.id - id of the notification
     * @param {String} variables.userId - user id of mentioned tweet author
     * @param {Object} variables.mentionedBy - user id of mention author
     * @param {Object} variables.mentionedByTweetId - tweet id of mention tweet
     * @returns {Promise<Mentioned>} async Notification:Mentioned type structure
     * @throws {Error} Either with custom payloads or GraphQL errors
     */

    async notifyDMed(variables) {
        try {
            if (!this.#client) throw Error("Cannot find required Appsync client")
            const NOTIFY_DMED = gql`
                mutation notifyDMed($id: ID!, $userId: ID!, $otherUserId: ID!, $message: String!) {
                    notifyDMed(
                        id: $id
                        userId: $userId
                        otherUserId: $otherUserId
                        message: $message
                    ) {
                        __typename
                        ... on DMed {
                            id
                            message
                            otherUserId
                            type
                            userId
                            createdAt
                        }
                    }
                }
            `;

            const { data, errors } = await this.#client.mutate({
                mutation: NOTIFY_DMED, 
                variables,
                errorPolicy: 'all'
            })

            if (errors) {
                console.error('GraphQL Errors :', JSON.stringify(errors))
                throwWithLabel(new Error('GraphQL Errors'), 'GraphQL Errors detected')
            }
            if (data) {
                return data.notifyDMed
            };
        } catch (caught) {
            throwWithLabel(caught, `GraphQL.notifyDMed`)
        }
    }
}