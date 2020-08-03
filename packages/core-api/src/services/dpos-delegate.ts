import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

export type DposDelegateLastBlock = {
    id: string;
    height: number;
    timestamp: number;
};

export type DposDelegate = {
    username: string;
    address: string;
    publicKey: string;
    votes: Utils.BigNumber;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
        last: DposDelegateLastBlock | undefined;
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

export type DposDelegateCriteria = Contracts.Search.StandardCriteriaOf<DposDelegate>;
export type DposDelegatesPage = Contracts.Search.Page<DposDelegate>;
