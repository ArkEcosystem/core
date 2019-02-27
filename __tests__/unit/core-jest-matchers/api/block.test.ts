import "../../../../packages/core-jest-matchers/src/api/block";

let block;

beforeEach(() => {
    block = {
        blockSignature: "",
        createdAt: "",
        generatorPublicKey: "",
        height: "",
        id: "",
        numberOfTransactions: "",
        payloadHash: "",
        payloadLength: "",
        previousBlock: "",
        reward: "",
        timestamp: "",
        totalAmount: "",
        totalFee: "",
        transactions: "",
        updatedAt: "",
        version: "",
    };
});
describe(".toBeValidBlock", () => {
    test("passes when given a valid block", () => {
        expect(block).toBeValidBlock();
    });

    test("fails given an invalid block", () => {
        delete block.reward;
        expect(expect(block).toBeValidBlock).toThrowError(/Expected .* to be a valid block/);
    });
});

describe(".toBeValidArrayOfBlocks", () => {
    test("passes given a valid array of blocks", () => {
        expect([block, block]).toBeValidArrayOfBlocks();
    });

    test("fails given an array with an invalid block", () => {
        delete block.reward;
        expect(expect([block, block]).toBeValidArrayOfBlocks).toThrowError(/Expected .* to be a valid array of blocks/);
    });

    test("fails when not given an array of blocks", () => {
        expect(expect(block).toBeValidArrayOfBlocks).toThrowError(/Expected .* to be a valid array of blocks/);
    });
});
