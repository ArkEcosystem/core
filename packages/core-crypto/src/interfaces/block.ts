import { Interfaces, Types } from "@arkecosystem/crypto/src";

export interface IBlockVerification {
    verified: boolean;
    errors: string[];
    containsMultiSignatures: boolean;
}

export interface IBlock {
    serialized: string;
    data: IBlockData;
    transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[];
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
    totalAmount: Types.BigNumber;
    totalFee: Types.BigNumber;
    reward: Types.BigNumber;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;

    blockSignature?: string;
    serialized?: string;
    transactions?: Interfaces.ITransactionData[];
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
    transactions?: Interfaces.ITransactionJson[];
}
