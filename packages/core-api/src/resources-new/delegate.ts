import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

export type DelegateCriteria = Contracts.Search.StandardCriteriaOf<DelegateResource>;

export type DelegateResource = {
    username: string;
    address: string;
    publicKey: string;
    votes: Utils.BigNumber;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
        last: DelegateResourceLastBlock | undefined;
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

export type DelegateResourceLastBlock = {
    id: string;
    height: number;
    timestamp: number;
};
