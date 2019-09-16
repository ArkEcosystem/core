import { Utils } from "@arkecosystem/core-kernel";
import { sortBy } from "@arkecosystem/utils";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeApiTransaction(): R;
        }
    }
}

expect.extend({
    toBeApiTransaction: (actual, expected) => {
        // TODO based on type
        const allowedKeys = sortBy([
            "id",
            "blockid",
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
        const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key));

        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid transaction`,
            pass: Utils.isEqual(sortBy(actualKeys), allowedKeys),
        };
    },
});
