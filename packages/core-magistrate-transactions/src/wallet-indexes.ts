import { Contracts, Utils } from "@arkecosystem/core-kernel";

export enum MagistrateIndex {
    Businesses = "businesses",
    Bridgechains = "bridgechains",
    Entities = "entities",
}

export const businessIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("business")) {
        Utils.assert.defined<string>(wallet.publicKey);
        index.set(wallet.publicKey, wallet);
    }
};

export const bridgechainIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("business.bridgechains")) {
        for (const bridgechainId of Object.keys(wallet.getAttribute("business.bridgechains"))) {
            // TODO: allow generic index values to create more sophisticated indexes like publicKey -> bridgechains
            index.set(bridgechainId, wallet);
        }
    }
};

export const entityIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("entities")) {
        for (const id of Object.keys(wallet.getAttribute("entities"))) {
            index.set(id, wallet);
        }
    }
};
