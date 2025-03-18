const { InitiateAuthCommand, CognitoIdentityProviderClient } = require("@aws-sdk/client-cognito-identity-provider"); // ES Modules import

const chance = require('chance').Chance()
const vtlUtil = require("@aws-amplify/amplify-appsync-simulator/lib/velocity/util")
const when = require("./when");


function random_name_email() {
    const EMAIL_HOST = "appsyncmasterclass.com"
    const firstName = chance.first({ nationality: 'en' })
    const lastName = chance.first({ nationality: 'en' })

    // Avoids possibility of name collisions over a large number of test runs
    const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnoprstuvwxyz' })

    const name = `${firstName} ${lastName} ${suffix}`
    const email = `${firstName}-${lastName}-${suffix}@${EMAIL_HOST}`

    return { name, email };
}

function random_pwd() {
    const passwordPre = chance.string({
        length: 10,
        alpha: true,
        numeric: true,
        symbols: true,
        casing: 'lower'
    })

    const passwordPost = chance.string({
        length: 6,
        alpha: true,
        numeric: true,
        symbols: true,
        casing: "upper"
    })

    return passwordPre + passwordPost
}

function random_user() {
    const { name, email } = random_name_email()
    const pwd = random_pwd()

    return {
        name,
        password: pwd,
        email
    }
}

function random_appsync_context(identity, args, result) {
    try {
        const util = vtlUtil.create([], new Date(), Object())

        const context = {
            identity,
            args,
            arguments: args,
            result
        }

        return {
            context,
            ctx: context,
            util,
            utils: util
        }
    } catch (err) {
        console.error('Err [given.random_appsync_context] ::', err.message)
        console.info(JSON.stringify(err.stack))
        return err
    }

}

async function authenticated_user() {
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

        const { name, email, password } = random_user();

        const userSignedUp = await when.user_signs_up(password, name, email)

        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: clientId,
            AuthParameters: {
                "USERNAME": userSignedUp.username,
                "PASSWORD": password
            }
        })

        const auth = await cognito.send(authCommand);

        if (auth.AvailableChallenges) {
            throw Error(`User requires more authentication challenges ${auth.AvailableChallenges}`)
        }

        if (!auth.AuthenticationResult) {
            throw Error("Authentication requires futher challenges")
        }

        const { IdToken, AccessToken } = auth.AuthenticationResult;

        if (!IdToken || !AccessToken) {
            throw Error("Undefined IdToken or AccessToken")
        }

        return {
            username: userSignedUp.username,
            name: userSignedUp.name,
            email: userSignedUp.email,
            idToken: IdToken,
            accessToken: AccessToken,
        }

    } catch (err) {
        console.error('Err [given.authenticated_user] ::', err.message)
        console.info(JSON.stringify(err.stack))
        return err
    }

}

module.exports = {
    random_user,
    random_appsync_context,
    random_name_email,
    authenticated_user,
}