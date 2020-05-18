import { CryptoSuite } from "@arkecosystem/core-crypto";

import passphrases from "./passphrases.json";

export class Delegates {
    public constructor(private cryptoManager: CryptoSuite.CryptoManager) {}

    public addresses(): string[] {
        return passphrases.map((passphrase: string) =>
            this.cryptoManager.Identities.Address.fromPassphrase(passphrase),
        );
    }

    public publicKeys(): string[] {
        return passphrases.map((passphrase: string) =>
            this.cryptoManager.Identities.PublicKey.fromPassphrase(passphrase),
        );
    }

    public privateKeys(): string[] {
        return passphrases.map((passphrase: string) =>
            this.cryptoManager.Identities.PrivateKey.fromPassphrase(passphrase),
        );
    }

    public wifs(): string[] {
        return passphrases.map((passphrase: string) => this.cryptoManager.Identities.Wif.fromPassphrase(passphrase));
    }

    public delegates(): {
        passphrase: string;
        address: string;
        publicKey: string;
        privateKey: string;
        wif: string;
    }[] {
        return passphrases.map((passphrase: string) => ({
            passphrase,
            address: this.cryptoManager.Identities.Address.fromPassphrase(passphrase),
            publicKey: this.cryptoManager.Identities.PublicKey.fromPassphrase(passphrase),
            privateKey: this.cryptoManager.Identities.PrivateKey.fromPassphrase(passphrase),
            wif: this.cryptoManager.Identities.Wif.fromPassphrase(passphrase),
        }));
    }
}
