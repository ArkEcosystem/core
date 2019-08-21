import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { IBusinessWalletAttributes } from "./interfaces";

export enum MarketplaceIndex {
    Businesses = "businesses",
    Bridgechains = "bridgechains",
}

export const businessIndexer = (index: State.IWalletIndex, wallet: Wallets.Wallet): void => {
    if (wallet.hasAttribute("business")) {
        const business = wallet.getAttribute<IBusinessWalletAttributes>("business");
        if (business !== undefined && !business.resigned && !index.has(wallet.publicKey)) {
            index.set(wallet.publicKey, wallet);
        }
    }
};

export const bridgechainIndexer = (index: State.IWalletIndex, wallet: Wallets.Wallet): void => {
    // if (wallet.hasAttribute("business.bridgechains")) {
    //     const bridgechains: IBridgechainWalletAttributes[] = wallet.getAttribute<IBusinessWalletAttributes>("business")
    //         .bridgechains;
    //     for (const bridgechain of bridgechains) {
    //         if (!index.has(bridgechain.registrationTransactionId)) {
    //             index.set(bridgechain.registrationTransactionId, wallet);
    //         }
    //     }
    // }
};
