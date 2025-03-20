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

const otherProfileFrag = `
fragment otherProfileFields on OtherProfile {
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
    following
    followedBy
}
`

const iProfileFrag = `
fragment iProfileFields on IProfile {
    ... on MyProfile {
        ... myProfileFields
    }

    ... on OtherProfile {
        ... otherProfileFields
    }
}
`

function registerAllFragments () {
    registerFragment('myProfileFields', myProfileFrag)
    registerFragment('otherProfileFields', otherProfileFrag)
    registerFragment('iProfileFields', iProfileFrag)
}

module.exports = {
    registerAllFragments
}