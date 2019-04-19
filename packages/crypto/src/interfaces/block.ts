import { ITransactionData } from "../interfaces";
import { BigNumber } from "../utils";
import { ITransaction, ITransactionJson } from "./transactions";

export interface IBlockVerification {
    verified: boolean;
    errors: string[];
    containsMultiSignatures: boolean;
}

export interface IBlock {
    serialized: string;
    data: IBlockData;
    transactions: ITransaction[];
    verification: IBlockVerification;

    getHeader(): IBlockData;
    verifySignature(): boolean;
    verify(): IBlockVerification;

    toString(): string;
    toJson(): IBlockJson;
}

export interface IBlockData {
    id?: string;
    idHex?: string;

    timestamp: number;
    version: number;
    height: number;
    previousBlockHex?: string;
    previousBlock: string;
    numberOfTransactions: number;
    totalAmount: BigNumber;
    totalFee: BigNumber;
    reward: BigNumber;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;

    blockSignature?: string;
    serialized?: string;
    transactions?: ITransactionData[];
}

export interface IBlockJson {
    id?: string;
    idHex?: string;

    timestamp: number;
    version: number;
    height: number;
    previousBlockHex?: string;
    previousBlock: string;
    numberOfTransactions: number;
    totalAmount: string;
    totalFee: string;
    reward: string;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;

    blockSignature?: string;
    serialized?: string;
    transactions?: ITransactionJson[];
}
