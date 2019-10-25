import { State } from "@arkecosystem/core-interfaces";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "./interfaces";

export enum MagistrateIndex {
    Businesses = "businesses",
    Bridgechains = "bridgechains",
}

export const businessIndexer = (index: State.IWalletIndex, wallet: State.IWallet): void => {
    if (wallet.hasAttribute("business")) {
        const business: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>("business");
        if (business !== undefined && !business.resigned) {
            index.set(business.businessId.toString(), wallet);
        }
    }
};

export const bridgechainIndexer = (index: State.IWalletIndex, wallet: State.IWallet): void => {
    if (wallet.hasAttribute("business.bridgechains")) {
        const bridgechains: Record<string, IBridgechainWalletAttributes> = wallet.getAttribute("business.bridgechains");
        for (const bridgechainId of Object.keys(bridgechains)) {
            // TODO: allow generic index values to create more sophisticated indexes like businessId -> bridgechains
            index.set(bridgechainId, wallet);
        }
    }
};
