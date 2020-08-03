import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";

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

export type HtlcLockCriteria = Contracts.Search.StandardCriteriaOf<HtlcLock>;
export type HtlcLocksPage = Contracts.Search.Page<HtlcLock>;
