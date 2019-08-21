import { Utils } from "@arkecosystem/crypto";

export interface IBusinessRegistrationAsset {
    name: string;
    website: string;
    vat?: string;
    repository?: string;
}

export interface IBusinessUpdateAsset {
    name?: string;
    website?: string;
    vat?: string;
    repository?: string;
}

export interface IBusinessWalletAttributes {
    businessAsset: IBusinessRegistrationAsset;
    nonce: Utils.BigNumber;
    resigned?: boolean;
    bridgechains?: Record<string, IBridgechainWalletAttributes>;
}

export interface IBridgechainRegistrationAsset {
    name: string;
    seedNodes: string[];
    genesisHash: string;
    bridgechainRepository: string;
}

export interface IBridgechainUpdateAsset {
    registeredBridgechainId: string;
    seedNodes: string[];
}

export interface IBridgechainResignationAsset {
    registeredBridgechainId: string;
}

export interface IBridgechainWalletAttributes {
    bridgechain: IBridgechainRegistrationAsset;
    nonce: Utils.BigNumber;
    resigned?: boolean;
}
