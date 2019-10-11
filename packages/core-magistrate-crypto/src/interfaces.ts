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
    bridgechainId: Utils.BigNumber;
}
