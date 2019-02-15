import { TransactionTypes } from "../constants";
import { Bignum } from "../utils";
import { TransactionSchema } from "./types/schemas";

export interface ITransactionAsset {
    signature?: {
        publicKey: string;
    };
    delegate?: {
        username: string;
        publicKey?: string;
    };
    votes?: string[];
    multisignature?: IMultiSignatureAsset;
    ipfs?: {
        dag: string;
    };
    payments?: any;
}

export interface IMultiSignatureAsset {
    min: number;
    keysgroup: string[];
    lifetime: number;
}

export interface ITransactionData {
    version?: number;
    network?: number;

    type: TransactionTypes;
    timestamp: number;
    senderPublicKey: string;

    fee: Bignum | number | string;
    amount: Bignum | number | string;

    expiration?: number;
    recipientId?: string;

    asset?: ITransactionAsset;
    vendorField?: string;
    vendorFieldHex?: string;

    id?: string;
    signature?: string;
    secondSignature?: string;
    signSignature?: string;
    signatures?: string[];

    blockId?: string;
    sequence?: number;

    timelock?: any;
    timelockType?: number;

    ipfsHash?: string;
    payments?: { [key: string]: any };
}

export interface ISchemaContext {
    fromData?: boolean;
    isGenesis?: boolean;
}

export interface ISchemaValidationResult {
    value: ITransactionData;
    error: any;
}
