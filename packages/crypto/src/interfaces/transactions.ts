import { ErrorObject } from "ajv";
import { TransactionTypes } from "../enums";
import { BigNumber } from "../utils";

export interface ITransaction {
    readonly id: string;
    readonly type: TransactionTypes;
    readonly verified: boolean;

    isVerified: boolean;

    data: ITransactionData;
    serialized: Buffer;
    timestamp: number;

    serialize(options?: ISerializeOptions): ByteBuffer;
    deserialize(buf: ByteBuffer): void;

    verify(): boolean;
    verifySchema(strict?: boolean): ISchemaValidationResult;

    toJson(): ITransactionJson;

    hasVendorField(): boolean;
}

export interface ITransactionAsset {
    signature?: {
        publicKey: string;
    };
    delegate?: {
        username: string;
        publicKey?: string;
    };
    votes?: string[];
    multiSignatureLegacy?: IMultiSignatureLegacyAsset;
    multiSignature?: IMultiSignatureAsset;
    ipfs?: string;
    payments?: any;
    [custom: string]: any;
}

export interface ITransactionData {
    version?: number;
    network?: number;

    type: TransactionTypes;
    timestamp: number;
    nonce: BigNumber;
    senderPublicKey: string;

    fee: BigNumber;
    amount: BigNumber;

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

    payments?: { [key: string]: any };
}

export interface ITransactionJson {
    version?: number;
    network?: number;

    type: TransactionTypes;
    timestamp: number;
    senderPublicKey: string;

    fee: string;
    amount: string;

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
    errors?: ErrorObject[];
}

export interface IMultiPaymentItem {
    amount: BigNumber;
    recipientId: string;
}

export interface IMultiSignatureLegacyAsset {
    min: number;
    lifetime: number;
    keysgroup: string[];
}

export interface IMultiSignatureAsset {
    min: number;
    publicKeys: string[];
}

export interface ISerializeOptions {
    excludeSignature?: boolean;
    excludeSecondSignature?: boolean;
    excludeMultiSignature?: boolean;
}
