import { Crypto } from "@arkecosystem/crypto";

import { KeyPairHolder } from "../../contracts/shared";
import { Bip38KeyPairHolder } from "./bip38-key-pair-holder";
import { Bip39KeyPairHolder } from "./bip39-key-pair-holder";

export class KeyPairHolderFactory {
    public static fromBIP38(bip38: string, password: string): KeyPairHolder {
        if (!Crypto.bip38.verify(bip38)) {
            throw new Error("Not bip38");
        }

        return new Bip38KeyPairHolder(bip38, password);
    }

    public static fromBIP39(passphrase: string): KeyPairHolder {
        if (Crypto.bip38.verify(passphrase)) {
            throw new Error("Not bip39");
        }

        return new Bip39KeyPairHolder(passphrase);
    }
}
