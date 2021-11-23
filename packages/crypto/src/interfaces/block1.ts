import { BigNumber } from "../utils";
import { ITransaction, ITransactionJson } from "./transactions";

export type IBlockSignedData1 = {
    readonly version: 1;
    readonly timestamp: number;
    readonly height: number;
    readonly previousBlock: string;
    readonly numberOfTransactions: number;
    readonly totalAmount: BigNumber;
    readonly totalFee: BigNumber;
    readonly reward: BigNumber;
    readonly payloadLength: number;
    readonly payloadHash: string;
    readonly generatorPublicKey: string;
    readonly previousBlockVotes: readonly string[];
};

export type IBlockHeaderData1 = IBlockSignedData1 & { readonly blockSignature: string };
export type IBlockData1 = IBlockHeaderData1 & { readonly transactions: readonly Buffer[] };

export type IBlockHeader1 = IBlockHeaderData1 & { readonly id: string };
export type IBlock1 = IBlockHeader1 & { readonly transactions: readonly ITransaction[] };

export type IBlockJson1 = {
    id: string;
    version: 1;
    timestamp: number;
    height: number;
    previousBlock: null;
    numberOfTransactions: number;
    totalAmount: string;
    totalFee: string;
    reward: string;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;
    previousBlockVotes: string[];
    blockSignature: string;
    transactions: ITransactionJson[];
};
