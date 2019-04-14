import { IKeyPair, IMessage } from "../interfaces";
import { configManager } from "../managers";
import { NetworkType } from "../types";
import { crypto } from "./crypto";
import { HashAlgorithms } from "./hash-algorithms";

export class Message {
    public static sign(message: string, passphrase: string): IMessage {
        const keys: IKeyPair = crypto.getKeys(passphrase);

        return {
            publicKey: keys.publicKey,
            signature: crypto.signHash(this.createHash(message), keys),
            message,
        };
    }

    public static signWithWif(message: string, wif: string, network?: NetworkType): IMessage {
        if (!network) {
            network = configManager.all();
        }

        const keys: IKeyPair = crypto.getKeysFromWIF(wif, network);

        return {
            publicKey: keys.publicKey,
            signature: crypto.signHash(this.createHash(message), keys),
            message,
        };
    }

    public static verify({ message, publicKey, signature }: IMessage): boolean {
        return crypto.verifyHash(this.createHash(message), signature, publicKey);
    }

    private static createHash(message: string): Buffer {
        return HashAlgorithms.sha256(message);
    }
}
