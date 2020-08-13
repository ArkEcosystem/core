import { Wallet } from "../wallet";

// todo: review implementation - quite a mess at the moment
export const getProperty = (wallet: unknown, prop: string): any => {
    if (typeof wallet !== "object" || wallet === null) {
        return undefined;
    }

    for (const [key, value] of Object.entries(wallet)) {
        if (key === prop) {
            return value;
        }

        const result = getProperty(value, prop);

        if (result !== undefined) {
            return result;
        }
    }

    if (wallet instanceof Wallet) {
        return getProperty(wallet.getAttributes(), prop);
    }

    return undefined;
};
