const { CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // ES Modules import
const fs = require("fs");
const vtlMapper = require("@aws-amplify/amplify-appsync-simulator/lib/velocity/value-mapper/mapper")
const vtlTemplate = require("amplify-velocity-template");
const {
    AppSyncClient,
    EvaluateMappingTemplateCommand
} = require("@aws-sdk/client-appsync");
const { GraphQL } = require('../lib/graphql');
const GraphQLFragments = require("../lib/utils/graphqlFragments");
const { throwWithLabel } = require("../lib/utils");

require('dotenv').config()
GraphQLFragments.registerAllFragments()

async function invoke_confirmUserSignup(username, name, email) {
    try {
        const handler = require('../../functions/confirm-user-signup').handler

        const context = {}
        const event = {
            "version": "1",
            "region": process.env.REGION,
            "userPoolId": process.env.COGNITO_USER_POOL_ID,
            "userName": username,
            "triggerSource": "PostConfirmation_ConfirmSignUp",
            "request": {
                "userAttributes": {
                    "sub": username,
                    "cognito:email_alias": email,
                    "cognito:user_status": "CONFIRMED",
                    "email_verified": "false",
                    "name": name,
                    "email": email
                }
            },
            "response": {}
        }

        await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_confirmUserSignup] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }

}

async function user_signs_up(password, name, email) {
    try {
        const cognito = new CognitoIdentityProviderClient({});

        const userPoolId = process.env.COGNITO_USER_POOL_ID
        const clientId = process.env.COGNITO_CLIENT_ID

        if (!userPoolId) {
            throw Error("Missing Environment vars: COGNITO_USER_POOL_ID")
        }

        if (!clientId) {
            throw Error("Missing Environment vars: COGNITO_CLIENT_ID")
        }

        const input = {
            ClientId: clientId, // required
            Username: email, // required
            Password: password,
            UserAttributes: [ // AttributeListType
                { // AttributeType
                    Name: "name", // required
                    Value: name,
                },
            ],
        }

        const command = new SignUpCommand(input);
        const response = await cognito.send(command);

        if (!response || !response.UserSub) {
            throw Error("User could not be signed up")
        }

        console.info(`User has signed up - [${email}]`)

        const username = response.UserSub;

        // Note: no longer needed since all users are confirmed by a PreSignup Lambda
        // const confirmCommand = new AdminConfirmSignUpCommand({
        //     UserPoolId: userPoolId, // required
        //     Username: username
        // })

        // const { $metadata } = await cognito.send(confirmCommand)

        // if ($metadata.httpStatusCode !== 200) {
        //     throw Error('Issue with sign-up confirmation')
        // }

        return {
            username,
            name,
            email
        }

    } catch (err) {
        console.error('Err [tests/steps/user_signs_up] : ', err.message);
        console.info(JSON.stringify(err.stack))
    }

}

function invoke_appsync_template(templatePath, context) {
    const template = fs.readFileSync(templatePath, { encoding: "utf-8" })

    const ast = vtlTemplate.parse(template)
    const compiler = new vtlTemplate.Compile(ast, {
        valueMapper: vtlMapper.map,
        escape: false // TODO: find out purpose
    })
    const render = compiler.render(context);
    // FIX: cleans trailing commas from render
    const lastCommaPattern = /\,(?=\s*?[\}\]])/g;
    const parsedRender = render.replace(lastCommaPattern, '');
    return JSON.parse(parsedRender)
}

async function invoke_appsync_EvaluateMappingTemplate(templatePath, context) {
    try {

        const { REGION } = process.env;
    
        if (!REGION) throw Error("Missing required env variables")
    
        const client = new AppSyncClient({ region: REGION });
    
        if (!client) throw Error('Problem with AppSync client initialisation')

        const template = fs.readFileSync(templatePath, { encoding: "utf-8" })
    
        if (!template) throw Error('Template not found')

        const command = new EvaluateMappingTemplateCommand({
            template,
            context: JSON.stringify(context)
        });

        const response = await client.send(command);
        const result = JSON.parse(response.evaluationResult);
        return result
    } catch (err) {
        console.error('Err [steps.when.invoke_appsync_EvaluateMappingTemplate] :', err.message);
        console.info(JSON.stringify(err))
        return err
    }
}


async function invoke_getImgUploadUrl({ username, extension, contentType }) {
    try {
        const handler = require('../../functions/get-img-upload-url').handler
        const context = {}
        const event = {
            identity: {
                username
            },
            arguments: {
                extension,
                contentType
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_getImgUploadUrl] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
        throw err;
    }

}

async function user_calls_getMyProfile(user) {
    const query = `query getMyProfile {
        getMyProfile {
          ... myProfileFields

          tweets {
            nextToken
            tweets {
                ... on Tweet {
                    ... tweetFields
                }
            }
          }
        }
    }`

    const data = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables: {},
        auth: user.accessToken
    })

    const profile = data.getMyProfile;

    return profile;
}

async function user_calls_editMyProfile(user, input) {
    const query = `mutation editMyProfile($input: ProfileInput!) {
        editMyProfile(newProfile: $input) {
          ... myProfileFields

          tweets {
            nextToken
            tweets {
                ... on Tweet {
                    ... tweetFields
                }
            }
          }
        }
    }`

    const variables = {
        input
    }

    const data = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    const profile = data.editMyProfile;

    return profile;
}

async function user_calls_getImageUploadUrl({
    user,
    extension,
    contentType
}) {
    try {
        const query = `query getImageUploadUrl ($extension: String, $contentType: String) {
            getImageUploadUrl(extension: $extension, contentType: $contentType) {
                url
                fileKey
            }
        }`

        const variables = {
            extension,
            contentType
        }

        const data = await GraphQL({
            url: process.env.APPSYNC_HTTP_URL,
            query,
            variables,
            auth: user.accessToken
        })
        return data.getImageUploadUrl;
    } catch (caught) {
        throwWithLabel(caught, 'when.user_calls_getImageUploadUrl')
    }
}

async function invoke_tweet(username, text) {
    try {
        const handler = require('../../functions/tweet').handler

        const context = {}
        const event = {
            identity: {
                username
            },
            arguments: {
                text
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_tweet] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }

}

async function invoke_retweet(username, tweetId) {
    try {
        const handler = require('../../functions/retweet').handler

        const context = {}
        const event = {
            identity: {
                username
            },
            arguments: {
                tweetId
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_retweet] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}

async function invoke_reply({ username, tweetId, text }) {
    try {
        const handler = require('../../functions/reply').handler

        const context = {}
        const event = {
            identity: {
                username
            },
            arguments: {
                tweetId,
                text,
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_reply] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}

async function user_calls_tweet(user, text) {
    const query = `mutation tweet($text: String!) {
        tweet(text: $text) {
            ... tweetFields
        }
    }`

    const variables = {
        text
    }

    const data = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return data.tweet;
}

async function user_calls_getTweets({ user, limit, givenNextToken = null }) {
    const query = `query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
        getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
            nextToken
            tweets {
                ... iTweetFields
            }
        }
    }`

    const variables = {
        userId: user.username,
        limit,
        nextToken: givenNextToken
    }

    const { getTweets } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return {
        tweets: getTweets.tweets,
        nextToken: getTweets.nextToken
    };
}

async function user_calls_getLikes({ user, limit, givenNextToken = null }) {
    const query = `query getLikes($userId: ID!, $limit: Int!, $nextToken: String) {
        getLikes(userId: $userId, limit: $limit, nextToken: $nextToken) {
            nextToken
            tweets {
                ... iTweetFields
            }
        }
    }`

    const variables = {
        userId: user.username,
        limit,
        nextToken: givenNextToken
    }

    const { getLikes } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return {
        tweets: getLikes.tweets,
        nextToken: getLikes.nextToken
    };
}

async function user_calls_getMyTimeline({ user, limit, givenNextToken = null }) {
    const query = `query getMyTimeline($limit: Int!, $nextToken: String) {
        getMyTimeline(limit: $limit, nextToken: $nextToken) {
            nextToken
            tweets {
                ... iTweetFields
            }
        }
    }`

    const variables = {
        limit,
        nextToken: givenNextToken
    }

    const { getMyTimeline } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return {
        tweets: getMyTimeline.tweets,
        nextToken: getMyTimeline.nextToken
    };
}

async function user_calls_like({ user, tweetId }) {
    const query = `mutation like($tweetId: ID!) {
        like(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const { like } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return like
}

async function user_calls_unlike({ user, tweetId }) {
    const query = `mutation unlike($tweetId: ID!) {
        unlike(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const { unlike } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return unlike
}

async function user_calls_retweet({ user, tweetId }) {
    const query = `mutation retweet($tweetId: ID!) {
        retweet(tweetId: $tweetId) {
            ... retweetFields
        }
    }`

    const variables = {
        tweetId
    }

    const { retweet } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return retweet
}

async function user_calls_reply({ user, tweetId, text }) {
    const query = `mutation reply($tweetId: ID!, $text: String!) {
        reply(tweetId: $tweetId, text: $text) {
            ... replyFields
        }
    }`

    const variables = {
        tweetId,
        text
    }

    const { reply } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return reply
}

async function invoke_unretweet(username, tweetId) {
    try {
        const handler = require('../../functions/unretweet').handler

        const context = {}
        const event = {
            identity: {
                username
            },
            arguments: {
                tweetId
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_unretweet] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}

async function user_calls_unretweet({ user, tweetId }) {
    const query = `mutation unretweet($tweetId: ID!) {
        unretweet(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const { unretweet } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return unretweet
}

async function user_calls_follow({ user, userId }) {
    const query = `mutation follow($userId: ID!) {
        follow(userId: $userId) 
    }`

    const variables = {
        userId
    }

    const { follow } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return follow
}

async function user_calls_getProfile({ user, screenName }) {
    const query = `query getProfile($screenName: String!) {
        getProfile(screenName: $screenName) {
          ... otherProfileFields

          tweets {
            nextToken
            tweets {
                ... on Tweet {
                    ... tweetFields
                }
            }
          }
        }
    }`

    const variables = {
        screenName
    }

    const data = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    const profile = data.getProfile;

    return profile;
}

async function invoke_distributeTweets(event) {
    try {
        const handler = require('../../functions/distributeTweets').handler

        const context = {}

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_distributeTweets] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}

async function invoke_distributeTweetsToFollower(event) {
    try {
        const handler = require('../../functions/distributeTweetsToFollower').handler

        const context = {}

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_distributeTweetsToFollower] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}

async function user_calls_unfollow({ user, userId }) {
    const query = `mutation unfollow($userId: ID!) {
        unfollow(userId: $userId) 
    }`

    const variables = {
        userId
    }

    const { unfollow } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return unfollow
}

async function user_calls_getFollowers({ user, userId, limit, givenNextToken = null }) {
    const query = `query getFollowers($userId: ID!, $limit: Int!, $nextToken: String) {
            getFollowers(userId: $userId, limit: $limit, nextToken: $nextToken) {
                nextToken
                profiles {
                    ... iProfileFields
                }
            }
        }`

    const variables = {
        userId,
        limit,
        nextToken: givenNextToken
    }

    const { getFollowers } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return getFollowers;
}

async function user_calls_getFollowing({ user, userId, limit, givenNextToken = null }) {
    const query = `query getFollowing($userId: ID!, $limit: Int!, $nextToken: String) {
            getFollowing(userId: $userId, limit: $limit, nextToken: $nextToken) {
                nextToken
                profiles {
                    ... iProfileFields
                }
            }
        }`

    const variables = {
        userId,
        limit,
        nextToken: givenNextToken
    }

    const { getFollowing } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query,
        variables,
        auth: user.accessToken
    })

    return getFollowing;
}

async function invoke_getImgPresignedUrl({ username, url }) {
    try {
        const handler = require('../../functions/get-img-presigned-url').handler
        const context = {}
        const event = {
            identity: {
                username
            },
            source: {
                imgUrl: url
            },
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_getImgPresignedUrl] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
        throw err;
    }

}

async function user_calls_search({ user, query, mode, limit, givenNextToken = null }) {
    const gqlQuery = `query search($query: String!, $limit: Int!, $nextToken: String) {
            search(limit: $limit, mode: ${mode}, query: $query, nextToken: $nextToken) {
                nextToken
                results {
                      __typename
                        ... on MyProfile {
                            ... myProfileFields
                        }
                        ... on OtherProfile {
                            ... otherProfileFields
                        }
                        ... on Tweet {
                            ... tweetFields
                        }
                        ... on Reply {
                            ... replyFields
                        }
                }
            }
        }`

    const variables = {
        query,
        // mode,
        limit,
        nextToken: givenNextToken
    }

    const { search } = await GraphQL({
        url: process.env.APPSYNC_HTTP_URL,
        query: gqlQuery,
        variables,
        auth: user.accessToken
    })

    return search;
}

module.exports = {
    invoke_appsync_template,
    invoke_confirmUserSignup,
    invoke_getImgUploadUrl,
    user_calls_editMyProfile,
    user_calls_getMyProfile,
    user_signs_up,
    user_calls_getImageUploadUrl,
    invoke_tweet,
    user_calls_tweet,
    user_calls_getTweets,
    user_calls_getMyTimeline,
    user_calls_like,
    user_calls_unlike,
    user_calls_getLikes,
    invoke_retweet,
    user_calls_retweet,
    invoke_unretweet,
    user_calls_unretweet,
    invoke_reply,
    user_calls_reply,
    user_calls_follow,
    user_calls_getProfile,
    invoke_distributeTweets,
    invoke_distributeTweetsToFollower,
    user_calls_unfollow,
    user_calls_getFollowers,
    user_calls_getFollowing,
    invoke_getImgPresignedUrl,
    invoke_appsync_EvaluateMappingTemplate,
    user_calls_search
}