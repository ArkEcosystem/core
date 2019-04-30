import { Hash } from "../crypto/hash";
import { TransactionTypes } from "../enums";
import { ISchemaValidationResult, ITransactionData } from "../interfaces";
import { isException } from "../utils";
import { validator } from "../validation";
import { Transaction, TransactionTypeFactory } from "./types";

export class Verifier {
    public static verify(data: ITransactionData): boolean {
        if (isException(data)) {
            return true;
        }

        if (data.type > 4 && data.type <= 99) {
            return false;
        }

        return Verifier.verifyHash(data);
    }

    public static verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        const secondSignature = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        const hash = Transaction.getHash(transaction, { excludeSecondSignature: true });
        if (transaction.version === 2) {
            return Hash.verifySchnorr(hash, secondSignature, publicKey);
        } else {
            return Hash.verifyECDSA(hash, secondSignature, publicKey);
        }
    }

    public static verifyHash(data: ITransactionData): boolean {
        const { signature, senderPublicKey } = data;
        if (!signature) {
            return false;
        }

        const hash = Transaction.getHash(data, { excludeSignature: true, excludeSecondSignature: true });
        if (data.version === 2) {
            return Hash.verifySchnorr(hash, signature, senderPublicKey);
        } else {
            return Hash.verifyECDSA(hash, signature, senderPublicKey);
        }
    }

    public static verifySchema(data: ITransactionData, strict: boolean = true): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (data.type === TransactionTypes.MultiSignature) {
            return { value: data, error: null };
        }

        const { $id } = TransactionTypeFactory.get(data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
