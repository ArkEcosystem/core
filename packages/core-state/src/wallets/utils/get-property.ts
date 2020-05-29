import { Utils } from "@arkecosystem/core-kernel";

import { Wallet } from "../wallet";

// todo: review implementation - quite a mess at the moment
export const getProperty = (wallet: any, prop: string): any => {
    // copy wallet and remove cryptoManager - we don't want to search this large object
    const walletCopy = Object.assign({}, wallet);
    delete walletCopy.cryptoManager;
    for (const [key, value] of Object.entries(walletCopy)) {
        if (key === prop) {
            return value;
        }

        Utils.assert.defined<object>(value);

        if (typeof value === "object") {
            const result = getProperty(value, prop);

            if (result !== undefined) {
                return result;
            }
        }
    }

    if (walletCopy instanceof Wallet) {
        return getProperty(walletCopy.getAttributes(), prop);
    }

    return undefined;
};
