import { Identities, Interfaces, Managers } from "@arkecosystem/crypto";

// todo: remove unitnet from crypto
Managers.configManager.setFromPreset("unitnet");

interface IIdentity {
    bip39: string;
    address: string;
    publicKey: string;
    privateKey: string;
    keys: Interfaces.IKeyPair;
    wif: string;
}

const bip39 = "this is a top secret passphrase";
const bip39Second = "this is a top secret second passphrase";

export const identity: IIdentity = {
    bip39,
    address: Identities.Address.fromPassphrase(bip39),
    publicKey: Identities.PublicKey.fromPassphrase(bip39),
    privateKey: Identities.PrivateKey.fromPassphrase(bip39),
    keys: Identities.Keys.fromPassphrase(bip39),
    wif: Identities.WIF.fromPassphrase(bip39),
};

export const identitySecond: IIdentity = {
    bip39: bip39Second,
    address: Identities.Address.fromPassphrase(bip39Second),
    publicKey: Identities.PublicKey.fromPassphrase(bip39Second),
    privateKey: Identities.PrivateKey.fromPassphrase(bip39Second),
    keys: Identities.Keys.fromPassphrase(bip39Second),
    wif: Identities.WIF.fromPassphrase(bip39Second),
};
