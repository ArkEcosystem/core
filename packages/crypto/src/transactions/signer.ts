import { CryptoManager } from "..";
import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
import { Utils } from "./utils";

export class Signer<T, U extends ITransactionData, E> {
    public constructor(private cryptoManager: CryptoManager<T>, private utils: Utils<T, U, E>) {}

    public sign(transaction: U, keys: IKeyPair, options?: ISerializeOptions): string {
        options = options || { excludeSignature: true, excludeSecondSignature: true };

        const hash: Buffer = this.utils.toHash(transaction, options);
        const signature: string =
            transaction.version && transaction.version > 1
                ? this.cryptoManager.LibraryManager.Crypto.Hash.signSchnorr(hash, keys)
                : this.cryptoManager.LibraryManager.Crypto.Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public secondSign(transaction: U, keys: IKeyPair): string {
        const hash: Buffer = this.utils.toHash(transaction, { excludeSecondSignature: true });
        const signature: string =
            transaction.version && transaction.version > 1
                ? this.cryptoManager.LibraryManager.Crypto.Hash.signSchnorr(hash, keys)
                : this.cryptoManager.LibraryManager.Crypto.Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    public multiSign(transaction: U, keys: IKeyPair, index = -1): string {
        if (!transaction.signatures) {
            transaction.signatures = [];
        }

        index = index === -1 ? transaction.signatures.length : index;

        const hash: Buffer = this.utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        const signature: string = this.cryptoManager.LibraryManager.Crypto.Hash.signSchnorr(hash, keys);
        const indexedSignature = `${this.cryptoManager.LibraryManager.Crypto.numberToHex(index)}${signature}`;
        transaction.signatures.push(indexedSignature);

        return indexedSignature;
    }
}
