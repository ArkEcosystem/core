import { ITransactionData } from "../interfaces";
import { Transaction } from "../transactions";
import { Bignum } from "../utils";

export interface IBlockVerification {
    verified: boolean;
    errors: string[];
}

// @TODO: fill out the whole interface
export interface IBlock {
    serialized: string;
    data: IBlockData;
    // @TODO: map this to an interface
    transactions: Transaction[];
    verification: IBlockVerification;

    // @TODO: make this required in another PR
    toJson?(): IBlockData;
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
    totalAmount: Bignum;
    totalFee: Bignum;
    reward: Bignum;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;

    blockSignature?: string;
    serialized?: string;
    transactions?: ITransactionData[];
}
