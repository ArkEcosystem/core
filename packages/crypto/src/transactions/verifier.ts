import { Hash } from "../crypto/hash";
import { TransactionTypes } from "../enums";
import { ISchemaValidationResult, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { isException } from "../utils";
import { validator } from "../validation";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";

export class Verifier {
    public static verify(data: ITransactionData): boolean {
        if (isException(data)) {
            return true;
        }

        if (data.type >= 4 && data.type <= 99 && !configManager.getMilestone().aip11) {
            return false;
        }

        return Verifier.verifyHash(data);
    }

    public static verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        const secondSignature: string = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        const hash: Buffer = Utils.toHash(transaction, { excludeSecondSignature: true });

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

        const hash: Buffer = Utils.toHash(data, {
            excludeSignature: true,
            excludeSecondSignature: true,
        });

        if (data.version === 2) {
            return Hash.verifySchnorr(hash, signature, senderPublicKey);
        } else {
            return Hash.verifyECDSA(hash, signature, senderPublicKey);
        }
    }

    public static verifySchema(data: ITransactionData, strict: boolean = true): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (data.type === TransactionTypes.MultiSignature) {
            return { value: data, error: undefined };
        }

        const { $id } = TransactionTypeFactory.get(data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
