import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { IBridgechainWalletProperty, IBusinessWalletProperty } from "./interfaces";

export const businessIndexer = (index: State.IWalletIndex, wallet: Wallets.Wallet): void => {
    if (wallet.hasAttribute("business")) {
        index.set(wallet.publicKey, wallet);
    }
};

export const bridgechainIndexer = (index: State.IWalletIndex, wallet: Wallets.Wallet): void => {
    if (wallet.hasAttribute("business.bridgechains")) {
        const bridgechains: IBridgechainWalletProperty[] = wallet.getAttribute<IBusinessWalletProperty>("business")
            .bridgechains;
        for (const bridgechain of bridgechains) {
            if (!index.has(bridgechain.registrationTransactionId)) {
                bridgechain.bridgechainNonce = index.all().length + 1 + 1000;
                index.set(bridgechain.registrationTransactionId, wallet);
            }
        }
    }
};
