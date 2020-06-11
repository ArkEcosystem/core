import { EntityAction, EntitySubType, EntityType } from "./enums";

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
    bridgechainAssetRepository?: string;
    ports: IBridgechainPorts;
}

export interface IBridgechainUpdateAsset {
    bridgechainId: string;
    seedNodes?: string[];
    ports?: IBridgechainPorts;
    bridgechainRepository?: string;
    bridgechainAssetRepository?: string;
}

export interface IBridgechainResignationAsset {
    bridgechainId: string;
}

export interface IEntityAssetData {
    name?: string;
    ipfsData?: string;
}

export interface IEntityAsset {
    type: EntityType;
    subType: EntitySubType;
    action: EntityAction;
    registrationId?: string;
    data: IEntityAssetData;
}
