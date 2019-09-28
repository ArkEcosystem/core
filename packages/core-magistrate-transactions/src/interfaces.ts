import { Interfaces } from "@arkecosystem/core-magistrate-crypto";
import { Utils } from "@arkecosystem/crypto";

export interface IBusinessWalletAttributes {
    businessAsset: Interfaces.IBusinessRegistrationAsset;
    businessId: Utils.BigNumber;
    resigned?: boolean;
    bridgechains?: Record<string, IBridgechainWalletAttributes>;
}

export interface IBridgechainWalletAttributes {
    bridgechainAsset: Interfaces.IBridgechainRegistrationAsset;
    bridgechainId: Utils.BigNumber;
    resigned?: boolean;
}
