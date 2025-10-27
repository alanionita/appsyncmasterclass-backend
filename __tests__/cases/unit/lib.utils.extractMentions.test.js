const { extractMentions } = require("../../../lib/utils");
const chance = require('chance').Chance();

describe("lib.util.extractMentions", () => {
    it("Should extract mention from tweet text", () => {
        const mention = "@user";
        const tweetText = "Test tweet " + mention;
        const result = extractMentions(tweetText)
        expect(result.length).toEqual(1);
        expect(result).toContain(mention);
    })
    it("Should extract multiple mentions from tweet text", () => {
        const randomArrLen = 25
        const randomArr = [...Array(randomArrLen)];
        const mentionsSet = new Set();

        randomArr.forEach(() => {
            const maxTagLength = 24;
            const randomStrLen = Math.floor(Math.random() * maxTagLength)

            let randomStr = chance.string({
                length: randomStrLen || 8, // Required: avoid empty mentions eg '#' which later cannot be RegExp matched
                alpha: true
            })

            if (mentionsSet.has(randomStr)) {
                randomStr = chance.string({
                    length: randomStrLen || 8, // Required: avoid empty mentions eg '#' which later cannot be RegExp matched
                    alpha: true
                })
                mentionsSet.add(`@${randomStr}`)
            } else {
                mentionsSet.add(`@${randomStr}`)
            }
        })

        const mentionsArr = [...mentionsSet]
        const mentionsStr = mentionsArr.join(', ');
        const tweetText2 = "Test tweet " + mentionsStr;
        const result2 = extractMentions(tweetText2)
        expect(result2.length).toEqual(mentionsSet.size);
        expect(result2).toEqual(mentionsArr);

    })
    it("Should return null for no mentions", () => {
        const mention = "";
        const tweetText = "Test tweet " + mention;
        const result = extractMentions(tweetText)
        expect(result).toBeNull();
    })

})