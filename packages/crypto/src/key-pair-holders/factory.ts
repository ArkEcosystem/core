import { verify } from "../crypto/bip38";
import { KeyPairHolder } from "../interfaces";
import { Bip38 } from "./bip38";
import { Bip39 } from "./bip39";

export class Factory {
    public static fromBIP38(bip38: string, password: string): KeyPairHolder {
        if (!verify(bip38)) {
            throw new Error("Not bip38");
        }

        return new Bip38(bip38, password);
    }

    public static fromBIP39(passphrase: string): KeyPairHolder {
        if (verify(passphrase)) {
            throw new Error("Not bip39");
        }

        return new Bip39(passphrase);
    }
}
