import { Hash } from "../crypto";
import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
import { numberToHex } from "../utils";
import { Utils } from "./utils";

export class Signer {
    public static sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): string {
        options = options || { excludeSignature: true, excludeSecondSignature: true };

        const hash: Buffer = Utils.toHash(transaction, options);
        const signature: string = transaction.version > 1 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public static secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Utils.toHash(transaction, { excludeSecondSignature: true });
        const signature: string = transaction.version > 1 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    public static multiSign(transaction: ITransactionData, keys: IKeyPair, index: number = -1): string {
        if (!transaction.signatures) {
            transaction.signatures = [];
        }

        index = index === -1 ? transaction.signatures.length : index;

        const hash: Buffer = Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        const signature: string = Hash.signSchnorr(hash, keys);
        const indexedSignature: string = `${numberToHex(index)}${signature}`;
        transaction.signatures.push(indexedSignature);

        return indexedSignature;
    }
}
