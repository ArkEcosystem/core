import { CryptoToolsManager } from "../crypto";
import { IKeyPair, IMessage } from "../interfaces";
import { Keys } from "./keys";

export class Message<T> {
    public constructor(private cryptoTools: CryptoToolsManager<T>, private keys: Keys<T>) {}

    public sign(message: string, passphrase: string): IMessage {
        const keys: IKeyPair = this.keys.fromPassphrase(passphrase);

        return {
            publicKey: keys.publicKey,
            signature: this.cryptoTools.Hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public signWithWif(message: string, wif: string): IMessage {
        const keys: IKeyPair = this.keys.fromWIF(wif);

        return {
            publicKey: keys.publicKey,
            signature: this.cryptoTools.Hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public verify({ message, publicKey, signature }: IMessage): boolean {
        return this.cryptoTools.Hash.verifyECDSA(this.createHash(message), signature, publicKey);
    }

    private createHash(message: string): Buffer {
        return this.cryptoTools.HashAlgorithms.sha256(message);
    }
}
