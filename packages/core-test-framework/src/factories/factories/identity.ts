import { Interfaces } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { FactoryBuilder } from "../factory-builder";

export const registerIdentityFactory = (factory: FactoryBuilder): void => {
    factory.set("Identity", ({ options }) => {
        const passphrase: string = options.passphrase || generateMnemonic();
        const identities = factory.cryptoManager.Identities;
        const keys: Interfaces.IKeyPair = identities.Keys.fromPassphrase(passphrase);

        return {
            keys,
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
            address: identities.Address.fromPassphrase(passphrase),
            wif: identities.Wif.fromPassphrase(passphrase),
            passphrase,
        };
    });

    factory.get("Identity").state("secondPassphrase", ({ entity, options }) => {
        entity.secondPassphrase = options.passphrase || generateMnemonic();

        return entity;
    });
};
