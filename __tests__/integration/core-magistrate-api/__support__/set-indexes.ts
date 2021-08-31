import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces as MagistrateInterfaces } from "@packages/core-magistrate-crypto";

export const setIndexes = (
    walletRepository: Contracts.State.WalletRepository,
    wallet: Contracts.State.Wallet,
): void => {
    for (const entityId of Object.keys(wallet.getAttribute("entities"))) {
        walletRepository.setOnIndex("entities", entityId, wallet);
    }

    for (const entity of Object.values(wallet.getAttribute("entities")) as MagistrateInterfaces.IEntityAsset[]) {
        walletRepository.setOnIndex("entityNamesTypes", `${entity.data.name}-${entity.type}`, wallet);
    }
};
