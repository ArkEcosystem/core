import { TransactionTypes } from "../../enums";
import { NotImplementedError } from "../../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { Verifier } from "../verifier";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return this.data.type;
    }
    public get verified(): boolean {
        return this.isVerified;
    }
    public static type: TransactionTypes = undefined;

    public static getSchema(): TransactionSchema {
        throw new NotImplementedError();
    }

    public isVerified: boolean;

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    public verify(): boolean {
        return Verifier.verify(this.data);
    }

    public verifySecondSignature(publicKey: string): boolean {
        return Verifier.verifySecondSignature(this.data, publicKey);
    }

    public verifySchema(): ISchemaValidationResult {
        return Verifier.verifySchema(this.data);
    }

    public toJson(): ITransactionJson {
        const data: ITransactionJson = JSON.parse(JSON.stringify(this.data));

        if (data.version === 1) {
            delete data.nonce;
        } else {
            delete data.timestamp;
        }

        if (!data.vendorFieldHex) {
            delete data.vendorFieldHex;
        }

        return data;
    }

    public hasVendorField(): boolean {
        return false;
    }
}
