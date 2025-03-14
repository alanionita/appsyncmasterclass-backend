module.exports.handler = async (event, context, callback) => {
    try {
        if (event.triggerSource == "PreSignUp_SignUp") {
            // Auto Confirms User and Email
            event.response.autoConfirmUser = true;
            event.response.autoVerifyEmail = true;

            // Return to Amazon Cognito
            callback(null, event);
        }
        callback(null, event);
    } catch (err) {
        console.error("Err [pre-confirm-user-signup-] ::", err.message)
        console.info(JSON.stringify(err.stack))
        if (err.$metadata) {
            console.info({ ...err.$metadata })
        }
    }
}