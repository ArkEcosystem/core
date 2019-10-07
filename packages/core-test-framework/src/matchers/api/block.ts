import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidBlock(): R;
            toBeValidArrayOfBlocks(): R;
        }
    }
}

const isValidBlock = block => {
    const allowedKeys = Utils.sortBy([
        "blockSignature",
        "createdAt",
        "generatorPublicKey",
        "height",
        "id",
        "numberOfTransactions",
        "payloadHash",
        "payloadLength",
        "previousBlock",
        "reward",
        "timestamp",
        "totalAmount",
        "totalFee",
        "transactions",
        "updatedAt",
        "version",
    ]);
    const actualKeys = Object.keys(block).filter(key => allowedKeys.includes(key));

    return Utils.isEqual(Utils.sortBy(actualKeys), allowedKeys);
};

expect.extend({
    toBeValidBlock: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid block`,
            pass: isValidBlock(actual),
        };
    },
    toBeValidArrayOfBlocks: (actual, expected) => {
        const message = () => `Expected ${JSON.stringify(actual)} to be a valid array of blocks`;

        if (!Array.isArray(actual)) {
            return { message, pass: false };
        }

        for (const peer of actual) {
            if (!isValidBlock(peer)) {
                return { message, pass: false };
            }
        }

        return { message, pass: true };
    },
});
