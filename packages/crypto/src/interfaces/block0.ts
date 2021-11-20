import { BigNumber } from "../utils";
import { ITransaction, ITransactionJson } from "./transactions";

export type IBlockSignedData0 = {
    readonly version: 0;
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
};

export type IBlockHeaderData0 = IBlockSignedData0 & { readonly blockSignature: string };
export type IBlockData0 = IBlockHeaderData0 & { readonly transactions: readonly Buffer[] };

export type IBlockHeader0 = IBlockHeaderData0 & { readonly id: string };
export type IBlock0 = IBlockHeader0 & { readonly transactions: readonly ITransaction[] };

export type IBlockJson0 = {
    id: string;
    version: 0;
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
    blockSignature: string;
    transactions: ITransactionJson[];
};
