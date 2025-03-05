const chance = require('chance').Chance()

function random_user() {
    const firstName = chance.first({ nationality: 'en' })
    const lastName = chance.first({ nationality: 'en' })

    // Avoids possibility of name collisions over a large number of test runs
    const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnoprstuvwxyz' })

    const name = `${firstName} ${lastName} ${suffix}`

    const password = chance.string({
        length: 8,
        alpha: true,
        numeric: true,
        symbols: true
    })
    const email = `${firstName}-${lastName}-${suffix}@appsyncmasterclass.com`

    return {
        name,
        password,
        email
    }
}

module.exports = {
    random_user
}