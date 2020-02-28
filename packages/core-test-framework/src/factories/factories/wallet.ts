import { Wallets } from "@arkecosystem/core-state";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { knownAttributes } from "../../internal/wallet-attributes";
import { FactoryBuilder } from "../factory-builder";

export const registerWalletFactory = (factory: FactoryBuilder): void => {
    factory.set("Wallet", ({ options }) => {
        const passphrase: string = options.passphrase || generateMnemonic();

        const wallet: Wallets.Wallet = new Wallets.Wallet(
            Identities.Address.fromPassphrase(passphrase),
            knownAttributes,
        );
        wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);

        return wallet;
    });

    factory.get("Wallet").state("secondPublicKey", ({ entity }) => {
        entity.setAttribute("secondPublicKey", Identities.PublicKey.fromPassphrase(generateMnemonic()));

        return entity;
    });
};
