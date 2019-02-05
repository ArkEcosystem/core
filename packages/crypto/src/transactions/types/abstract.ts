import { JoiObject } from "joi";
import { TransactionRepository } from "..";
import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import { TransactionTypeNotImplementedError } from "../../errors";
import { Wallet } from "../../models/wallet";
import { isException } from "../../utils";
import { TransactionDeserializer } from "../deserializers";
import { ITransactionData } from "../interfaces";
import { TransactionSerializer } from "../serializers";

export abstract class AbstractTransaction {
    public static getType(): TransactionTypes {
        throw new TransactionTypeNotImplementedError();
    }

    public static fromHex(hex: string): AbstractTransaction {
        return TransactionDeserializer.deserializeV2(hex);
    }

    public static from(data: ITransactionData): AbstractTransaction {
        const transaction = TransactionRepository.create(data);

        // TODO:
        // 1. validate schema + sanitize
        // 2. serialize ?
        // 3. deserialize is not necessary anymore if 1) plus crypto.verify are in place

        TransactionSerializer.serializeV2(transaction);
        TransactionDeserializer.deserializeV2(transaction.serialized.toString("hex"));

        return transaction;
    }

    public data: ITransactionData;
    public serialized: Buffer;

    public abstract serialize(): ByteBuffer;

    public abstract deserialize(buf: ByteBuffer): void;

    public abstract canBeApplied(wallet: Wallet): boolean;

    public verify(): boolean {
        const { data } = this;
        if (isException(data)) {
            return true;
        }

        if (data.type >= 4) {
            return false;
        }

        return crypto.verify(data);
    }

    protected hasVendorField(): boolean {
        return false;
    }
}
