import { TransactionTypes } from "../constants";
import { Bignum } from "../utils";

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
    [custom: string]: any;
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

export interface ISchemaValidationResult<T = any> {
    value: T;
    error: any;
}
