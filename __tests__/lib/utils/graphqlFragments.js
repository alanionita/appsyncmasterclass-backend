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

const tweetFrag = `
fragment tweetFields on Tweet {
    id
    profile {
        ... iProfileFields
    }
    createdAt
    text
    replies
    likes
    retweets
    liked
    retweeted
}
`

const iTweetFrag = `
fragment iTweetFields on ITweet {
    ... on Tweet {
        ... tweetFields
    }
}
`

function registerAllFragments () {
    registerFragment('myProfileFields', myProfileFrag);
    registerFragment('otherProfileFields', otherProfileFrag);
    registerFragment('iProfileFields', iProfileFrag);
    registerFragment('tweetFields', tweetFrag);
    registerFragment('iTweetFields', iTweetFrag)
}

module.exports = {
    registerAllFragments
}