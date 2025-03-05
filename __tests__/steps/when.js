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

module.exports = {
    invoke_confirmUserSignup
}