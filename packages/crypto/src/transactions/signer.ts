import { Hash } from "../crypto";
import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
import { Utils } from "./utils";

export class Signer {
    public static sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): string {
        options = options || { excludeSignature: true, excludeSecondSignature: true };

        const hash: Buffer = Utils.toHash(transaction, options);
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public static secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Utils.toHash(transaction, { excludeSecondSignature: true });
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }
}
