import { Interfaces } from "@arkecosystem/crypto";

export const transformLock = (lock: Interfaces.IHtlcLock) => {
    return {
        ...lock,
        amount: lock.amount.toFixed(),
    };
};
