import { Interfaces } from "@arkecosystem/core-magistrate-crypto";

export interface IBusinessWalletAttributes {
    businessAsset: Interfaces.IBusinessRegistrationAsset;
    businessId: number;
    resigned?: boolean;
    bridgechains?: Record<string, IBridgechainWalletAttributes>;
}

export interface IBridgechainWalletAttributes {
    bridgechainAsset: Interfaces.IBridgechainRegistrationAsset;
    bridgechainId: number;
    resigned?: boolean;
}
