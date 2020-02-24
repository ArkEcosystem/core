import { State } from "@arkecosystem/core-interfaces";
import { IBusinessWalletAttributes } from "./interfaces";

export enum MagistrateIndex {
    Businesses = "businesses",
}

export const businessIndexer = (index: State.IWalletIndex, wallet: State.IWallet): void => {
    if (wallet.hasAttribute("business")) {
        const business: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>("business");
        if (business !== undefined && !business.resigned) {
            index.set(wallet.publicKey, wallet);
        }
    }
};
