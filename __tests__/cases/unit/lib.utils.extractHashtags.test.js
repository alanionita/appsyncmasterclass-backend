const { extractHashtags } = require("../../../lib/utils");
const chance = require('chance').Chance();

describe("lib.util.extractHastags", () => {
    it("Should extract hashtag from tweet text", () => {
        const hashtag = "#hashtag";
        const tweetText = "Test tweet " + hashtag;
        const result = extractHashtags(tweetText)
        expect(result.length).toEqual(1);
        expect(result).toContain('#hashtag');
    })
    it("Should extract multiple hashtags from tweet text", () => {
        const randomArrLen = 25
        const randomArr = [...Array(randomArrLen)];
        const hashtagSet = new Set();

        randomArr.forEach(() => {
            const maxTagLength = 24;
            const randomStrLen = Math.floor(Math.random() * maxTagLength)

            let randomStr = chance.string({
                length: randomStrLen || 8, // Required: avoid empty hashtags eg '#' which later cannot be RegExp matched
                alpha: true
            })

            if (hashtagSet.has(randomStr)) {
                randomStr = chance.string({
                    length: randomStrLen || 8, // Required: avoid empty hashtags eg '#' which later cannot be RegExp matched
                    alpha: true
                })
                hashtagSet.add(`#${randomStr}`)
            } else {
                hashtagSet.add(`#${randomStr}`)
            }
        })

        const hashtagsArr = [...hashtagSet]
        const hashtagStr = hashtagsArr.join(', ');
        const tweetText2 = "Test tweet " + hashtagStr;
        const result2 = extractHashtags(tweetText2)
        expect(result2.length).toEqual(hashtagSet.size);
        expect(result2).toEqual(hashtagsArr);

    })
    it("Should return null for no hastags", () => {
        const hashtag = "";
        const tweetText = "Test tweet " + hashtag;
        const result = extractHashtags(tweetText)
        expect(result).toBeNull();
    })

})