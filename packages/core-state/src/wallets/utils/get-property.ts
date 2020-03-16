import { Utils } from "@arkecosystem/core-kernel";

import { Wallet } from "../wallet";

// todo: review implementation - quite a mess at the moment
export const getProperty = (wallet: any, prop: string): any => {
    for (const [key, value] of Object.entries(wallet)) {
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

    if (wallet instanceof Wallet) {
        return getProperty(wallet.getAttributes(), prop);
    }

    return undefined;
};
