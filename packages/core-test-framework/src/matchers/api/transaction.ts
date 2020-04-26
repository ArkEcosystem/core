import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeApiTransaction(): R;
        }
    }
}

expect.extend({
    toBeApiTransaction: (actual, expected) => {
        // TODO based on type
        const allowedKeys = Utils.sortBy([
            "id",
            "blockId",
            "type",
            "timestamp",
            "amount",
            "fee",
            "senderId",
            "senderPublicKey",
            "signature",
            "asset",
            "confirmations",
        ]);
        const actualKeys = Object.keys(actual).filter((key) => allowedKeys.includes(key));

        return {
            message: /* istanbul ignore next */ () => `Expected ${JSON.stringify(actual)} to be a valid transaction`,
            pass: Utils.isEqual(Utils.sortBy(actualKeys), allowedKeys),
        };
    },
});
