export interface IBridgechainPorts {
    [name: string]: number;
}

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
    ports: IBridgechainPorts;
}

export interface IBridgechainUpdateAsset {
    bridgechainId: string;
    seedNodes?: string[];
    ports?: IBridgechainPorts;
}

export interface IBridgechainResignationAsset {
    bridgechainId: string;
}
