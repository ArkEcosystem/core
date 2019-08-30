import { Hash } from "../crypto/hash";
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

        if (configManager.getMilestone().aip11 && (!data.version || data.version === 1)) {
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
        return this.internalVerifySignature(hash, secondSignature, publicKey);
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

        return this.internalVerifySignature(hash, signature, senderPublicKey);
    }

    public static verifySchema(data: ITransactionData, strict: boolean = true): ISchemaValidationResult {
        const { $id } = TransactionTypeFactory.get(data.type, data.typeGroup).getSchema();
        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }

    private static internalVerifySignature(hash: Buffer, signature: string, publicKey: string): boolean {
        const isSchnorr = Buffer.from(signature, "hex").byteLength === 64;
        if (isSchnorr) {
            return Hash.verifySchnorr(hash, signature, publicKey);
        }

        return Hash.verifyECDSA(hash, signature, publicKey);
    }
}
