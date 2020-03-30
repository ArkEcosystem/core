import { Utils } from "@arkecosystem/core-kernel";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeValidPeer(): R;
            toBeValidArrayOfPeers(): R;
        }
    }
}

const isValidPeer = (peer) => {
    const allowedKeys = Utils.sortBy(["ip", "port"]);
    const actualKeys = Object.keys(peer).filter((key) => allowedKeys.includes(key));

    return Utils.isEqual(Utils.sortBy(actualKeys), allowedKeys);
};

expect.extend({
    toBeValidPeer: (actual, expected) => {
        return {
            message: /* istanbul ignore next */ () => `Expected ${JSON.stringify(actual)} to be a valid peer`,
            pass: isValidPeer(actual),
        };
    },

    toBeValidArrayOfPeers: (actual, expected) => {
        /* istanbul ignore next */
        const message = () => `Expected ${JSON.stringify(actual)} to be a valid array of peers`;

        if (!Array.isArray(actual)) {
            return { message, pass: false };
        }

        for (const peer of actual) {
            if (!isValidPeer(peer)) {
                return { message, pass: false };
            }
        }

        return { message, pass: true };
    },
});
