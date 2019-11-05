import { Identities, Interfaces } from "@arkecosystem/crypto";

export const generateIdentity = (
    passphrase: string,
    network?: Interfaces.Network,
): {
    bip39: string;
    address: string;
    publicKey: string;
    privateKey: string;
    keys: Interfaces.IKeyPair;
    wif: string;
} => ({
    bip39: passphrase,
    address: Identities.Address.fromPassphrase(passphrase, network ? network.pubKeyHash : undefined),
    publicKey: Identities.PublicKey.fromPassphrase(passphrase),
    privateKey: Identities.PrivateKey.fromPassphrase(passphrase),
    keys: Identities.Keys.fromPassphrase(passphrase),
    wif: Identities.WIF.fromPassphrase(passphrase, network),
});
