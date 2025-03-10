const { AdminConfirmSignUpCommand, CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // ES Modules import

require('dotenv').config()

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
        if (response) {
            const username = response.UserSub;
            console.info(`User has signed up - [${email}]`)
            
            const confirmCommand = new AdminConfirmSignUpCommand({
                UserPoolId: userPoolId, // required
                Username: username
            })

            await cognito.send(confirmCommand)

            console.info(`Confirmed signup - [${email}]`)
            
            return {
                username,
                name, 
                email
            }
        }

    } catch (err) {
        console.error('Err [tests/steps/user_signs_up] : ', err.message);
        console.info(JSON.stringify(err.stack))
    }

}

module.exports = {
    invoke_confirmUserSignup,
    user_signs_up
}