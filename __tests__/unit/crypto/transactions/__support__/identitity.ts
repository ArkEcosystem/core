import { CryptoManager, Interfaces } from "@arkecosystem/crypto/src";

export const constructIdentity = <T = any>(passphrase: string, crypto: CryptoManager<T>) => {
    const keys: Interfaces.IKeyPair = crypto.Identities.Keys.fromPassphrase(passphrase);

    return {
        keys,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        address: crypto.Identities.Address.fromPassphrase(passphrase),
        wif: crypto.Identities.Wif.fromPassphrase(passphrase),
        passphrase,
    };
};
