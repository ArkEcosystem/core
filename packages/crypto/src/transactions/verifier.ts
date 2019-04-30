import { Hash } from "../crypto/hash";
import { TransactionTypes } from "../enums";
import { ISchemaValidationResult, ITransactionData } from "../interfaces";
import { isException } from "../utils";
import { validator } from "../validation";
import { transactionRegistry } from "./registry";
import { Transaction } from "./types";

export class Verifier {
    public static verify(data: ITransactionData): boolean {
        if (isException(data)) {
            return true;
        }

        if (data.type >= 4 && data.type <= 99) {
            return false;
        }

        return Verifier.verifyHash(data);
    }

    public static verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        const secondSignature = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        return Hash.verify(
            Transaction.getHash(transaction, { excludeSecondSignature: true }),
            secondSignature,
            publicKey,
        );
    }

    public static verifyHash(data: ITransactionData): boolean {
        if (data.version && data.version !== 1) {
            // TODO: enable AIP11 when ready here
            return false;
        }

        if (!data.signature) {
            return false;
        }

        return Hash.verify(
            Transaction.getHash(data, { excludeSignature: true, excludeSecondSignature: true }),
            data.signature,
            data.senderPublicKey,
        );
    }

    public static verifySchema(data: ITransactionData, strict: boolean = true): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (data.type === TransactionTypes.MultiSignature) {
            return { value: data, error: null };
        }

        const { $id } = transactionRegistry.get(data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
