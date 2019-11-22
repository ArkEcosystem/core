import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { FactoryBuilder } from "../factory-builder";

export const registerWalletFactory = (factory: FactoryBuilder): void => {
    factory.set("Wallet", () => {
        const passphrase: string = generateMnemonic();

        const { publicKey, privateKey } = Identities.Keys.fromPassphrase(passphrase);

        return {
            publicKey,
            privateKey,
            address: Identities.Address.fromPassphrase(passphrase),
            wif: Identities.WIF.fromPassphrase(passphrase),
            passphrase,
        };
    });

    factory.get("Wallet").state("secondPassphrase", ({ entity }) => {
        entity.secondPassphrase = generateMnemonic();

        return entity;
    });
};
