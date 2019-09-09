import { ErrorObject } from "ajv";
import { Enums } from "..";
import { BigNumber } from "../utils";

export interface ITransaction {
    readonly id: string;
    readonly typeGroup: number;
    readonly type: number;
    readonly verified: boolean;
    readonly key: string;
    readonly staticFee: BigNumber;

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
    };
    votes?: string[];
    multiSignatureLegacy?: IMultiSignatureLegacyAsset;
    multiSignature?: IMultiSignatureAsset;
    ipfs?: string;
    payments?: IMultiPaymentItem[];
    lock?: IHtlcLockAsset;
    claim?: IHtlcClaimAsset;
    refund?: IHtlcRefundAsset;
    [custom: string]: any;
}

export interface ITransactionData {
    version?: number;
    network?: number;

    typeGroup?: number;
    type: number;
    timestamp: number;
    nonce?: BigNumber;
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
}

export interface ITransactionJson {
    version?: number;
    network?: number;

    typeGroup?: number;
    type: number;

    timestamp?: number;
    nonce?: string;
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

    ipfsHash?: string;
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

export interface IHtlcLockAsset {
    secretHash: string;
    expiration: {
        type: Enums.HtlcLockExpirationType;
        value: number;
    };
}

export interface IHtlcClaimAsset {
    lockTransactionId: string;
    unlockSecret: string;
}

export interface IHtlcRefundAsset {
    lockTransactionId: string;
}

export interface IHtlcLock {
    amount: BigNumber;
    recipientId: string;
    asset: IHtlcLockAsset;
}

export type IHtlcLocks = Record<string, IHtlcLock>;

export interface IHtlcExpiration {
    type: Enums.HtlcLockExpirationType;
    value: number;
}

export interface IDeserializeOptions {
    acceptLegacyVersion?: boolean;
}

export interface ISerializeOptions {
    acceptLegacyVersion?: boolean;
    excludeSignature?: boolean;
    excludeSecondSignature?: boolean;
    excludeMultiSignature?: boolean;
}
