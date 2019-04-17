// tslint:disable:member-ordering
import { TransactionRegistry } from "..";
import { crypto } from "../../crypto";
import { TransactionTypes } from "../../enums";
import { NotImplementedError } from "../../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { isException } from "../../utils";
import { validator } from "../../validation";
import { deserializer } from "../deserializer";
import { Serializer } from "../serializer";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: TransactionTypes = null;

    public static toBytes(data: ITransactionData): Buffer {
        const transaction = TransactionRegistry.create(data);
        return Serializer.serialize(transaction);
    }

    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return this.data.type;
    }

    public isVerified: boolean;
    public get verified(): boolean {
        return this.isVerified;
    }

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    public verify(): boolean {
        const { data } = this;

        if (isException(data)) {
            return true;
        }

        if (data.type >= 4 && data.type <= 99) {
            return false;
        }

        return crypto.verify(data);
    }

    public toJson(): ITransactionJson {
        const data: ITransactionJson = JSON.parse(JSON.stringify(this.data));
        data.amount = this.data.amount.toFixed();
        data.fee = this.data.fee.toFixed();

        if (data.vendorFieldHex === null) {
            delete data.vendorFieldHex;
        }

        return data;
    }

    public hasVendorField(): boolean {
        return false;
    }

    public static getSchema(): TransactionSchema {
        throw new NotImplementedError();
    }
}
