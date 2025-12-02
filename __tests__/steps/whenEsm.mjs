import { handler } from '../../functions/send-direct-message.mjs'

export async function invoke_sendDirectMessage({
    user,
    message,
    otherUserId }) {
    try {
        const context = {}
        const event = {
            identity: {
                username: user
            },
            arguments: {
                message,
                otherUserId
            }
        }

        return await handler(event, context)
    } catch (err) {
        console.error("Err [tests/steps/when/invoke_sendDirectMessage] ::", err.message);
        console.info(JSON.stringify(err))
        if (err.$metadata) {
            const { requestId, cfId, extendedRequestId } = err.$metadata;
            console.info({ requestId, cfId, extendedRequestId })
        }
    }
}