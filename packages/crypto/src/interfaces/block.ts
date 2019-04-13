import { ITransactionData } from "../interfaces";
import { Bignum } from "../utils";

export interface IBlockVerification {
    verified: boolean;
    errors: string[];
}

export interface IBlock {
    data: IBlockData;

    toJson(): IBlockData;
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
