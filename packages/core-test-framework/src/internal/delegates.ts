import { Identities } from "@arkecosystem/crypto";

import passphrases from "./passphrases.json";

export { passphrases };

export const addresses: string[] = passphrases.map((passphrase: string) =>
    Identities.Address.fromPassphrase(passphrase),
);

export const publicKeys: string[] = passphrases.map((passphrase: string) =>
    Identities.PublicKey.fromPassphrase(passphrase),
);

export const privateKeys: string[] = passphrases.map((passphrase: string) =>
    Identities.PrivateKey.fromPassphrase(passphrase),
);

export const wifs: string[] = passphrases.map((passphrase: string) => Identities.WIF.fromPassphrase(passphrase));

export const delegates: {
    passphrase: string;
    address: string;
    publicKey: string;
    privateKey: string;
    wif: string;
}[] = passphrases.map((passphrase: string) => ({
    passphrase,
    address: Identities.Address.fromPassphrase(passphrase),
    publicKey: Identities.PublicKey.fromPassphrase(passphrase),
    privateKey: Identities.PrivateKey.fromPassphrase(passphrase),
    wif: Identities.WIF.fromPassphrase(passphrase),
}));
