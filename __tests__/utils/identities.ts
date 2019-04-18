import { Address, Keys, PrivateKey, PublicKey, WIF } from "../../packages/crypto/src/identities";
import { IKeyPair } from "../../packages/crypto/src/interfaces";

interface IIdentity {
    bip39: string;
    address: string;
    publicKey: string;
    privateKey: string;
    keys: IKeyPair;
    wif: string;
}

const bip39: string = "this is a top secret passphrase";
const bip39Second: string = "this is a top secret second passphrase";

export const identity: IIdentity = {
    bip39,
    address: Address.fromPassphrase(bip39),
    publicKey: PublicKey.fromPassphrase(bip39),
    privateKey: PrivateKey.fromPassphrase(bip39),
    keys: Keys.fromPassphrase(bip39),
    wif: WIF.fromPassphrase(bip39),
};

export const identitySecond: IIdentity = {
    bip39: bip39Second,
    address: Address.fromPassphrase(bip39Second),
    publicKey: PublicKey.fromPassphrase(bip39Second),
    privateKey: PrivateKey.fromPassphrase(bip39Second),
    keys: Keys.fromPassphrase(bip39Second),
    wif: WIF.fromPassphrase(bip39Second),
};
