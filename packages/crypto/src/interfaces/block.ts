import { BigNumber } from "../utils";
import { ISchnorrMultiSignature } from "./serde";
import { ITransaction, ITransactionJson } from "./transactions";

type IBlock0 = {
    readonly version: 0;
};

type IBlock1 = {
    readonly version: 1;
    readonly previousBlockVotes: readonly ISchnorrMultiSignature[];
};

export type IBlockSignedSection = (IBlock0 | IBlock1) & {
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

export type IBlockSignatureSection = {
    readonly blockSignature: string;
};

export type IBlockPayloadSection = {
    readonly transactions: readonly {
        readonly serialized: Buffer;
    }[];
};

export type IBlockHeader = {
    readonly id: string;
} & (IBlockSignedSection & IBlockSignatureSection);

export type IBlock = IBlockHeader & {
    readonly transactions: readonly ITransaction[];
};

export type IBlockHeaderData = IBlockSignedSection & IBlockSignatureSection;
export type IBlockData = IBlockHeaderData & IBlockPayloadSection;

export type INewBlockData = (IBlock0 | IBlock1) & {
    readonly timestamp: number;
    readonly height: number;
    readonly previousBlock: string;
    readonly transactions: readonly ITransaction[];
};

// ---

type IGenesisBlockJson0 = {
    readonly version: 0;
};

type IGenesisBlockJson1 = {
    readonly version: 1;
    readonly previousBlockVotes: readonly string[];
};

export type IGenesisBlockJson = (IGenesisBlockJson0 | IGenesisBlockJson1) & {
    readonly timestamp: number;
    readonly height: number;
    readonly previousBlock: null;
    readonly numberOfTransactions: number;
    readonly totalAmount: string;
    readonly totalFee: string;
    readonly reward: string;
    readonly payloadLength: number;
    readonly payloadHash: string;
    readonly generatorPublicKey: string;
    readonly blockSignature: string;
    readonly transactions: readonly ITransactionJson[];
    readonly id: string;
};
