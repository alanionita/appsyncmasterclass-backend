const { CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // ES Modules import
const fs = require("fs");
const vtlMapper = require("@aws-amplify/amplify-appsync-simulator/lib/velocity/value-mapper/mapper")
const vtlTemplate = require("amplify-velocity-template");
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
            getImageUploadUrl(extension: $extension, contentType: $contentType)
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
    user_calls_getMyTimeline
}