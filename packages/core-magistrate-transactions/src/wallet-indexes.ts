import { Contracts } from "@arkecosystem/core-kernel";

import { IBusinessWalletAttributes } from "./interfaces";

export enum MagistrateIndex {
    Businesses = "businesses",
    Bridgechains = "bridgechains",
}

export const businessIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("business")) {
        const business: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>("business");

        if (business !== undefined && !business.resigned) {
            index.set(business.businessId.toFixed(), wallet);
        }
    }
};

export const bridgechainIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("business.bridgechains")) {
        for (const bridgechainId of Object.keys(wallet.getAttribute("business.bridgechains"))) {
            // TODO: allow generic index values to create more sophisticated indexes like businessId -> bridgechains
            index.set(bridgechainId, wallet);
        }
    }
};
