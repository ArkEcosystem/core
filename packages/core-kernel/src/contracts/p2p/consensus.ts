import * as Utils from "../../utils";

export interface CreateBlockProposalRequest {
    blockHash: string;
    height: number;
    generatorPublicKey: string;
    signature: string;
    timestamp: number;
    payload: {
        version: number;
        generatorPublicKey: string;
        timestamp: number;
        previousBlock: string;
        height: number;
        numberOfTransactions: number;
        totalAmount: Utils.BigNumber;
        totalFee: Utils.BigNumber;
        reward: Utils.BigNumber;
        payloadLength: number;
        payloadHash: string;
        transactions: Buffer[];
        signatures: string[];
    };
    headers: any;
}

export interface CreateBlockProposalResponse {
    status: boolean;
}
