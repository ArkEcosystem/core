import { Interfaces } from "@arkecosystem/crypto";
export declare const transformLock: (lock: Interfaces.IHtlcLock) => {
    amount: string;
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
    recipientId: string;
    vendorField: string;
    secretHash: string;
    expiration: {
        type: import("@arkecosystem/crypto/dist/enums").HtlcLockExpirationType;
        value: number;
    };
};
