import { Identities, Interfaces } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { FactoryBuilder } from "../factory-builder";

export const registerIdentityFactory = (factory: FactoryBuilder): void => {
    factory.set("Identity", () => {
        const passphrase: string = generateMnemonic();

        const keys: Interfaces.IKeyPair = Identities.Keys.fromPassphrase(passphrase);

        return {
            keys,
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
            address: Identities.Address.fromPassphrase(passphrase),
            wif: Identities.WIF.fromPassphrase(passphrase),
            passphrase,
        };
    });

    factory.get("Identity").state("secondPassphrase", ({ entity }) => {
        entity.secondPassphrase = generateMnemonic();

        return entity;
    });
};
