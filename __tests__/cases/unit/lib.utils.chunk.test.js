const { chunk } = require("../../../lib/utils");
const chance = require('chance').Chance();

describe("lib.util.chunk", () => {
    it("Should create chunks from array", () => {
        const input = [1, 2, 3, 4, 5, 6];
        const chunkSize = 2;
        const result = chunk(input, chunkSize)
        expect(result.length).toEqual(3);
        expect(result[0]).toStrictEqual([1, 2]);
        expect(result[1]).toStrictEqual([3, 4]);
        expect(result[2]).toStrictEqual([5, 6]);
    })
    it("Should create 25 item chunks from array", () => {
        const input = Array(50).fill(null)
        const numbers = input.map((n) => {
            const cnat = chance.natural({ min: 0, max: 200 });
            return cnat
        })
        const chunkSize = 25;
        const result = chunk(numbers, chunkSize)
        expect(result.length).toEqual(2);
        expect(result[0]).toStrictEqual(numbers.slice(0, 25));
        expect(result[1]).toStrictEqual(numbers.slice(-25));
    })
    it("Should chunk when items are less than size", () => {
        const input = [1]
        const chunkSize = 25;
        const result = chunk(input, chunkSize)
        expect(result.length).toEqual(1); // 1 chunk
        expect(result[0].length).toStrictEqual(1) // 1 item in chunk 1;
        expect(result[0]).toStrictEqual([1]) // 1 item in chunk 1;

        const input2 = [{ name: 'test1', id: 1 }, { name: 'test2', id: 2 }];
        const result2 = chunk(input2, chunkSize)
        expect(result2.length).toEqual(1); // 1 chunk
        expect(result2[0].length).toStrictEqual(2) // 2 items in chunk 1;
    })

})