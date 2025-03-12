const chance = require('chance').Chance()
const vtlUtil = require("@aws-amplify/amplify-appsync-simulator/lib/velocity/util")

function random_user() {
    const firstName = chance.first({ nationality: 'en' })
    const lastName = chance.first({ nationality: 'en' })

    // Avoids possibility of name collisions over a large number of test runs
    const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnoprstuvwxyz' })

    const name = `${firstName} ${lastName} ${suffix}`

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
        casing: "upper"
    })


    const email = `${firstName}-${lastName}-${suffix}@appsyncmasterclass.com`

    return {
        name,
        password: passwordPre + passwordPost,
        email
    }
}

function random_appsync_context(identity, args) {
    try {
        const util = vtlUtil.create([], new Date(), Object())

        const context = {
            identity,
            args,
            arguments: args
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

module.exports = {
    random_user,
    random_appsync_context
}