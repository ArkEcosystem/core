import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export type BlockCriteria = BlockCriteriaItem | BlockCriteriaItem[];
export type BlockCriteriaItem = {
    id?: string | string[];
    version?: number | number[];
    timestamp?: number | number[];
    previousBlock?: string | string[];
    height?: Contracts.Search.NumericCriteria<number>;
    numberOfTransactions?: Contracts.Search.NumericCriteria<number>;
    totalAmount?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    totalFee?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    reward?: Contracts.Search.NumericCriteria<Utils.BigNumber>;
    payloadLength?: Contracts.Search.NumericCriteria<number>;
    payloadHash?: string | string[];
    generatorPublicKey?: string | string[];
    blockSignature?: string | string[];
};

export type TransformedBlockResource = {
    id: string;
    version: number;
    height: number;
    previous: string;
    forged: {
        reward: Utils.BigNumber;
        fee: Utils.BigNumber;
        amount: Utils.BigNumber;
        total: Utils.BigNumber;
    };
    payload: {
        hash: string;
        length: number;
    };
    generator: {
        username: string | undefined;
        address: string;
        publicKey: string;
    };
    signature: string;
    confirmations: number;
    transactions: number;
    timestamp: { epoch: number; unix: number; human: string };
};

export type SomeBlockResource = Interfaces.IBlockData | TransformedBlockResource;
export type SomeBlockResourcesPage =
    | Contracts.Search.Page<Interfaces.IBlockData>
    | Contracts.Search.Page<TransformedBlockResource>;
