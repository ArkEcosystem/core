import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces as MagistrateInterfaces } from "@arkecosystem/core-magistrate-crypto";

export enum MagistrateIndex {
    Businesses = "businesses",
    Bridgechains = "bridgechains",
    Entities = "entities",
    EntityNamesTypes = "entityNamesTypes",
}

export const businessIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("business")) {
        Utils.assert.defined<string>(wallet.getPublicKey());
        index.set(wallet.getPublicKey()!, wallet);
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

export const entityNameTypeIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet): void => {
    if (wallet.hasAttribute("entities")) {
        for (const asset of Object.values(wallet.getAttribute("entities") as MagistrateInterfaces.IEntityAsset)) {
            index.set(`${asset.data.name}-${asset.type}` , wallet);
        }
    }
};
