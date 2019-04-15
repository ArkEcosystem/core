import { IKeyPair, IMessage } from "../interfaces";
import { INetwork } from "../interfaces/networks";
import { configManager } from "../managers";
import { crypto } from "./crypto";
import { HashAlgorithms } from "./hash-algorithms";

export class Message {
    public static sign(message: string, passphrase: string): IMessage {
        const keys: IKeyPair = crypto.getKeys(passphrase);

        return {
            publicKey: keys.publicKey,
            signature: crypto.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public static signWithWif(message: string, wif: string, network?: INetwork): IMessage {
        if (!network) {
            network = configManager.get("network");
        }

        const keys: IKeyPair = crypto.getKeysFromWIF(wif, network);

        return {
            publicKey: keys.publicKey,
            signature: crypto.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public static verify({ message, publicKey, signature }: IMessage): boolean {
        return crypto.verifyECDSA(this.createHash(message), signature, publicKey);
    }

    private static createHash(message: string): Buffer {
        return HashAlgorithms.sha256(message);
    }
}
