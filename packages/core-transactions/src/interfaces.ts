import { Contracts } from "@arkecosystem/core-kernel";
import { Utils, Enums } from "@arkecosystem/crypto";

export type HtlcLockCriteria = Contracts.Search.StandardCriteriaOf<HtlcLock>;

export type HtlcLock = {
    lockId: string;
    senderPublicKey: string;
    isExpired: boolean;

    amount: Utils.BigNumber;
    secretHash: string;
    recipientId: string;
    timestamp: number;
    expirationType: Enums.HtlcLockExpirationType;
    expirationValue: number;
    vendorField: string;
};

export type DelegateCriteria = Contracts.Search.StandardCriteriaOf<Delegate>;

export type Delegate = {
    username: string;
    address: string;
    publicKey: string;
    votes: Utils.BigNumber;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
        last: DelegateLastBlock | undefined;
    };
    production: {
        approval: number;
    };
    forged: {
        fees: Utils.BigNumber;
        rewards: Utils.BigNumber;
        total: Utils.BigNumber;
    };
};

export type DelegateLastBlock = {
    id: string;
    height: number;
    timestamp: number;
};
