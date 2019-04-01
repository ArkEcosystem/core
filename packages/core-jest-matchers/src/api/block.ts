import { sortBy } from "@arkecosystem/utils";
import isEqual from "lodash.isequal";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeValidBlock(): R;
            toBeValidArrayOfBlocks(): R;
        }
    }
}

function isValidBlock(block) {
    const allowedKeys = sortBy([
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

    return isEqual(sortBy(actualKeys), allowedKeys);
}

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
