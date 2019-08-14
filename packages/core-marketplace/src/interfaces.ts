export interface IBusinessRegistrationAsset {
    name: string;
    website: string;
    vat?: string;
    organizationRepository?: string;
}

export interface IBusinessUpdateAsset {
    name?: string;
    website?: string;
    vat?: string;
    organizationRepository?: string;
}

export interface IBusinessWalletProperty {
    businessAsset: IBusinessRegistrationAsset;
    resigned?: boolean;
    bridgechains?: IBridgechainWalletProperty[];
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

export interface IBridgechainWalletProperty {
    bridgechain: IBridgechainRegistrationAsset;
    registrationTransactionId: string;
    bridgechainNonce?: number;
    resigned?: boolean;
}
