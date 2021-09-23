import { State } from "@arkecosystem/core-interfaces";
export declare const transformDelegate: (delegate: State.IWallet) => {
    username: string;
    address: string;
    publicKey: string;
    votes: string;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
    };
    production: {
        approval: number;
    };
    forged: {
        fees: string;
        rewards: string;
        total: string;
    };
};
