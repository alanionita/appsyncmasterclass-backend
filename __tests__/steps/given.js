const chance = require('chance').Chance()

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
        password: passwordPre+passwordPost,
        email
    }
}

module.exports = {
    random_user
}