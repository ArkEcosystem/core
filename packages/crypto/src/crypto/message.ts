import { Keys } from "../identities/keys";
import { IKeyPair, IMessage } from "../interfaces";
import { Hash } from "./hash";
import { HashAlgorithms } from "./hash-algorithms";

export class Message {
    public constructor(private hash: Hash, private hashAlgorithms: HashAlgorithms, private keys: Keys) {}

    public sign(message: string, passphrase: string): IMessage {
        const keys: IKeyPair = this.keys.fromPassphrase(passphrase);

        return {
            publicKey: keys.publicKey,
            signature: this.hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public signWithWif(message: string, wif: string): IMessage {
        const keys: IKeyPair = this.keys.fromWIF(wif);

        return {
            publicKey: keys.publicKey,
            signature: this.hash.signECDSA(this.createHash(message), keys),
            message,
        };
    }

    public verify({ message, publicKey, signature }: IMessage): boolean {
        return this.hash.verifyECDSA(this.createHash(message), signature, publicKey);
    }

    private createHash(message: string): Buffer {
        return this.hashAlgorithms.sha256(message);
    }
}
