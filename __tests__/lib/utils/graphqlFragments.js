const { registerFragment } = require('../graphql');

const myProfileFrag = `
fragment myProfileFields on MyProfile {
    id
    name
    screenName
    imgUrl
    bgImgUrl
    bio
    location
    website
    birthdate
    createdAt
    followersCount
    followingCount
    tweetsCount
    likesCount
}
`

function registerAllFragments () {
    registerFragment('myProfileFields', myProfileFrag)
}

module.exports = {
    registerAllFragments
}