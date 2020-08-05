import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/core-magistrate-crypto";

export interface IBusinessWalletAttributes {
    businessAsset: Interfaces.IBusinessRegistrationAsset;
    resigned?: boolean;
    bridgechains?: Record<string, IBridgechainWalletAttributes>;
}

export interface IBridgechainWalletAttributes {
    bridgechainAsset: Interfaces.IBridgechainRegistrationAsset;
    resigned?: boolean;
}

export interface IEntityWallet {
    type: Enums.EntityType;
    subType: Enums.EntitySubType;
    data: Interfaces.IEntityAssetData;
    resigned?: boolean;
}

export interface IEntitiesWallet {
    [registrationId: string]: IEntityWallet;
}

export type EntityCriteria = Contracts.Search.StandardCriteriaOf<Entity>;

export type Entity = {
    id: string;
    publicKey: string;
    address: string;
    isResigned: boolean;
    type: Enums.EntityType;
    subType: Enums.EntitySubType;
    data: Interfaces.IEntityAssetData;
};
