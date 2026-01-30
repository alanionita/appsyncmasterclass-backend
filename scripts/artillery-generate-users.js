const given = require('../__tests__/steps/given')
const fs = require('fs')

async function handler() {
  try {
    const pUserCount = process.argv[2]

    console.info(`Generating ${pUserCount} users...`)

    if (!pUserCount) {
      throw new Error('must specify "count", e.g. ./script 10')
    }

    if (pUserCount < 1) {
      throw new Error('"count" must be at least 1, e.g. ./script 10')
    }

    const users = []
    
    for (let i = 0; i < pUserCount; i++) {
      const user = await given.authenticated_user()
      users.push(user)
    }

    const csv = users.map(x => x.idToken).join('\n')
    fs.writeFileSync('./.artillery/users.csv', csv)
    
    console.info('Done!')
  } catch (err) {
    console.error(err.message)
  }
}

handler();