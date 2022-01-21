import { Crypto } from "@arkecosystem/crypto";

import { Passphrase } from "../interfaces";
import { Bip38Passphrase } from "./bip38-passphrase";
import { Bip39Passphrase } from "./bip39-passphrase";

export class PassphraseFactory {
    public static fromBIP38(bip38: string, password: string): Passphrase {
        if (!Crypto.bip38.verify(bip38)) {
            throw new Error("Not bip38");
        }

        return new Bip38Passphrase(bip38, password);
    }

    public static fromBIP39(passphrase: string): Passphrase {
        if (Crypto.bip38.verify(passphrase)) {
            throw new Error("Not bip39");
        }

        return new Bip39Passphrase(passphrase);
    }
}
