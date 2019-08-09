
export interface IBusinessRegistrationAsset {
    name: string;
    website: string;
    vat?: string;
    github?: string;
}

export interface IBusinessWalletProperty {
    businessAsset: IBusinessRegistrationAsset;
    isBusinessResigned?: boolean;
    bridgechains?: IBridgechainWalletProperty[];
}

export interface IBridgechainRegistrationAsset {
    name: string;
    seedNodes: string[];
    genesisHash: string;
    githubRepository: string;
}

export interface IBridgechainResignationAsset {
    registeredBridgechainId: string;
}

export interface IBridgechainWalletProperty {
    bridgechain: IBridgechainRegistrationAsset;
    registrationTransactionId: string;
    bridgechainNonce: number;
    isBridgechainResigned?: boolean;
}
