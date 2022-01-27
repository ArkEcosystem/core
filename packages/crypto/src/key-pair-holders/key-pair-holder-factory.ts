import { verify } from "../crypto/bip38";
import { KeyPairHolder } from "../interfaces";
import { Bip38KeyPairHolder } from "./bip38-key-pair-holder";
import { Bip39KeyPairHolder } from "./bip39-key-pair-holder";

export class KeyPairHolderFactory {
    public static fromBIP38(bip38: string, password: string): KeyPairHolder {
        if (!verify(bip38)) {
            throw new Error("Not bip38");
        }

        return new Bip38KeyPairHolder(bip38, password);
    }

    public static fromBIP39(passphrase: string): KeyPairHolder {
        if (verify(passphrase)) {
            throw new Error("Not bip39");
        }

        return new Bip39KeyPairHolder(passphrase);
    }
}
