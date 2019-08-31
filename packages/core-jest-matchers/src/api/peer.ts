import { sortBy } from "@arkecosystem/utils";
import isEqual from "lodash.isequal";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidPeer(): R;
            toBeValidArrayOfPeers(): R;
        }
    }
}

const isValidPeer = peer => {
    const allowedKeys = sortBy(["ip", "port"]);
    const actualKeys = Object.keys(peer).filter(key => allowedKeys.includes(key));

    return isEqual(sortBy(actualKeys), allowedKeys);
};

expect.extend({
    toBeValidPeer: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify(actual)} to be a valid peer`,
            pass: isValidPeer(actual),
        };
    },

    toBeValidArrayOfPeers: (actual, expected) => {
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
