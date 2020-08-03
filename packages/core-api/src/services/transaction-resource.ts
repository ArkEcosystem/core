import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export type PoolTransactionCriteria = Contracts.Search.StandardCriteriaOf<Interfaces.ITransactionData>;

export type TransactionCriteria = TransactionCriteriaItem | TransactionCriteriaItem[];
export type TransactionCriteriaItem = {
    address?: string | string[];
    senderId?: string | string[];
    recipientId?: string | string[];
    id?: string | string[];
    version?: number | number[];
    blockId?: string | string[];
    sequence?: Contracts.Search.NumericCriteria<number>;
    timestamp?: Contracts.Search.NumericCriteria<number>;
    nonce?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    senderPublicKey?: string | string[];
    type?: number | number[];
    typeGroup?: number | number[];
    vendorField?: string | string[];
    amount?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    fee?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    asset?: object | object[];
};

export type TransformedTransactionResource = {
    id: string;
    blockId: string | undefined;
    version: number;
    nonce: Utils.BigNumber;
    type: number;
    typeGroup: number;
    amount: Utils.BigNumber;
    fee: Utils.BigNumber;
    sender: string;
    senderPublicKey: string;
    recipient: string;
    signature: string;
    signSignature: string | undefined;
    signatures: string[] | undefined;
    vendorField: string | undefined;
    asset: object;
    confirmations: number;
    timestamp: { epoch: number; unix: number; human: string } | undefined;
};

export type SomeTransactionResource = Interfaces.ITransactionData | TransformedTransactionResource;
export type SomeTransactionResourcesPage =
    | Contracts.Search.Page<Interfaces.ITransactionData>
    | Contracts.Search.Page<TransformedTransactionResource>;
