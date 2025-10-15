const TweetTypes = {
    TWEET: 'Tweet',
    RETWEET: 'Retweet',
    REPLY: 'Reply'
}

const DynamoDB = {
    MAX_BATCH_SIZE: 25
}

const SearchMode = {
    top: "Top",
    latest: "Latest",
    people: "People",
    photos: "Photos",
    video: "Videos"
}

module.exports = {
    TweetTypes,
    DynamoDB,
    SearchMode
}