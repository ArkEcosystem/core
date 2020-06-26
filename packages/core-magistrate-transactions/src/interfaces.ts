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
