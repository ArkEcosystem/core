import { Wallets } from "@arkecosystem/core-state";
import { Identities } from "@arkecosystem/crypto";
import { Services } from "@packages/core-kernel";
import { generateMnemonic } from "bip39";

import { getWalletAttributeSet } from "../../internal/wallet-attributes";
import { FactoryBuilder } from "../factory-builder";

export const registerWalletFactory = (factory: FactoryBuilder): void => {
    factory.set("Wallet", ({ options }) => {
        const passphrase: string = options.passphrase || generateMnemonic();

        const wallet: Wallets.Wallet = new Wallets.Wallet(
            Identities.Address.fromPassphrase(passphrase),
            new Services.Attributes.AttributeMap(getWalletAttributeSet()),
        );
        wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);

        return wallet;
    });

    factory.get("Wallet").state("secondPublicKey", ({ entity }) => {
        entity.setAttribute("secondPublicKey", Identities.PublicKey.fromPassphrase(generateMnemonic()));

        return entity;
    });
};
