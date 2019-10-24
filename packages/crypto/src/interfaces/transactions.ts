import { ErrorObject } from "ajv";

import { Enums } from "..";
import { BigNumber } from "../utils";

export interface ITransaction {
    readonly id: string | undefined;
    readonly typeGroup: number | undefined;
    readonly type: number;
    readonly verified: boolean;
    readonly key: string;
    readonly staticFee: BigNumber;

    isVerified: boolean;

    data: ITransactionData;
    serialized: Buffer;
    timestamp: number;

    serialize(options?: ISerializeOptions): ByteBuffer | undefined;
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
    version?: number | undefined;
    network?: number | undefined;

    typeGroup?: number | undefined;
    type: number;
    timestamp: number;
    nonce?: BigNumber | undefined;
    senderPublicKey: string | undefined;

    fee: BigNumber;
    amount: BigNumber;

    expiration?: number | undefined;
    recipientId?: string | undefined;

    asset?: ITransactionAsset | undefined;
    vendorField?: string | undefined;

    id?: string | undefined;
    signature?: string | undefined;
    secondSignature?: string | undefined;
    signSignature?: string | undefined;
    signatures?: string[] | undefined;

    blockId?: string | undefined;
    sequence?: number | undefined;
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
    vendorField?: string | undefined;

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
    value: T | undefined;
    error: any;
    errors?: ErrorObject[] | undefined;
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

export interface IHtlcLock extends IHtlcLockAsset {
    amount: BigNumber;
    recipientId: string | undefined;
    timestamp: number;
    vendorField: string | undefined;
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

    // WORKAROUND: A handful of mainnet transactions have an invalid
    // recipient. Due to a refactor of the Address network byte
    // validation it is no longer trivially possible to handle them.
    // If an invalid address is encountered during transfer serialization,
    // this error field is used to bubble up the error and defer the
    // `AddressNetworkByteError` until the actual id is available to call `isException`.
    addressError?: string;
}
