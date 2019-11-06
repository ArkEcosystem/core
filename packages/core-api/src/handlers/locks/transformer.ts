import { Interfaces } from "@arkecosystem/crypto";
import { Contracts } from "@arkecosystem/core-kernel";

export const transformLock = (app: Contracts.Kernel.Application, lock: Interfaces.IHtlcLock) => {
    return {
        ...lock,
        amount: lock.amount.toFixed(),
    };
};
