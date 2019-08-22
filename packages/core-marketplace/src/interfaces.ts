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
    businessId: Utils.BigNumber;
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
    bridgechainId: Utils.BigNumber;
    seedNodes: string[];
}

export interface IBridgechainResignationAsset {
    bridgechainId: string;
}

export interface IBridgechainWalletAttributes {
    bridgechainAsset: IBridgechainRegistrationAsset;
    bridgechainId: Utils.BigNumber;
    resigned?: boolean;
}
