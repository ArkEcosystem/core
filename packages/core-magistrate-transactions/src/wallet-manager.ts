import { State } from "@arkecosystem/core-interfaces";
import { IBusinessWalletAttributes } from "./interfaces";

export enum MagistrateIndex {
    Businesses = "businesses",
    Entities = "entities",
}

export const businessIndexer = (index: State.IWalletIndex, wallet: State.IWallet): void => {
    if (wallet.hasAttribute("business")) {
        const business: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>("business");
        if (business !== undefined && !business.resigned) {
            index.set(wallet.publicKey, wallet);
        }
    }
};

export const entityIndexer = (index: State.IWalletIndex, wallet: State.IWallet): void => {
    if (wallet.hasAttribute("entities")) {
        for (const id of Object.keys(wallet.getAttribute("entities"))) {
            index.set(id, wallet);
        }
    }
};
