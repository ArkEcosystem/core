// tslint:disable:member-ordering
import { TransactionRegistry } from "..";
import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import {
    InsufficientBalanceError,
    InvalidSecondSignatureError,
    MalformedTransactionBytesError,
    NotImplementedError,
    SenderWalletMismatchError,
    TransactionSchemaError,
    TransactionVersionError,
    UnexpectedMultiSignatureError,
    UnexpectedSecondSignatureError,
} from "../../errors";
import { configManager } from "../../managers";
import { Wallet } from "../../models/wallet";
import { Bignum, isException } from "../../utils";
import { AjvWrapper } from "../../validation";
import { TransactionDeserializer } from "../deserializers";
import { ISchemaValidationResult, ITransactionData } from "../interfaces";
import { TransactionSerializer } from "../serializers";
import { TransactionSchema } from "./schemas";

export abstract class Transaction {
    public static type: TransactionTypes = null;

    public static fromHex(hex: string): Transaction {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer): Transaction {
        return this.fromSerialized(buffer);
    }

    private static fromSerialized(serialized: string | Buffer): Transaction {
        try {
            const transaction = TransactionDeserializer.deserialize(serialized);
            const { value, error } = this.validateSchema(transaction.data, true);
            if (error !== null) {
                throw new TransactionSchemaError(error);
            }

            transaction.isVerified = transaction.verify();
            return transaction;
        } catch (error) {
            if (error instanceof TransactionVersionError || error instanceof TransactionSchemaError) {
                throw error;
            }

            throw new MalformedTransactionBytesError();
        }
    }

    public static fromData(data: ITransactionData, strict: boolean = true): Transaction {
        const { value, error } = this.validateSchema(data, strict);
        if (error !== null) {
            throw new TransactionSchemaError(error);
        }

        const transaction = TransactionRegistry.create(value);
        TransactionDeserializer.applyV1Compatibility(transaction.data); // TODO: generalize this kinda stuff
        TransactionSerializer.serialize(transaction);

        data.id = crypto.getId(data);
        transaction.isVerified = transaction.verify();

        return transaction;
    }

    public static toBytes(data: ITransactionData): Buffer {
        const transaction = TransactionRegistry.create(data);
        return TransactionSerializer.serialize(transaction);
    }

    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return this.data.type;
    }

    private isVerified: boolean;
    public get verified(): boolean {
        return this.isVerified;
    }

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    /**
     * Serde
     */
    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    /**
     * Wallet stuff
     */
    public canBeApplied(wallet: Wallet): boolean {
        const { data } = this;
        // NOTE: Checks if it can be applied based on sender wallet
        // could be merged with `apply` so they are coupled together :thinking_face:

        if (wallet.multisignature) {
            throw new UnexpectedMultiSignatureError();
        }

        if (
            wallet.balance
                .minus(data.amount)
                .minus(data.fee)
                .isLessThan(0)
        ) {
            throw new InsufficientBalanceError();
        }

        if (data.senderPublicKey !== wallet.publicKey) {
            throw new SenderWalletMismatchError();
        }

        if (wallet.secondPublicKey) {
            if (!crypto.verifySecondSignature(data, wallet.secondPublicKey)) {
                throw new InvalidSecondSignatureError();
            }
        } else {
            if (data.secondSignature || data.signSignature) {
                // Accept invalid second signature fields prior the applied patch.
                // NOTE: only applies to devnet.
                if (!configManager.getMilestone().ignoreInvalidSecondSignatureField) {
                    throw new UnexpectedSecondSignatureError();
                }
            }
        }

        return true;
    }

    public applyToSender(wallet: Wallet): void {
        const { data } = this;

        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount).minus(data.fee);

            this.apply(wallet);

            wallet.dirty = true;
        }
    }

    public applyToRecipient(wallet: Wallet): void {
        const { data } = this;

        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount);
            wallet.dirty = true;
        }
    }

    public revertForSender(wallet: Wallet): void {
        const { data } = this;

        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount).plus(data.fee);

            this.revert(wallet);

            wallet.dirty = true;
        }
    }

    public revertForRecipient(wallet: Wallet): void {
        const { data } = this;

        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount);
            wallet.dirty = true;
        }
    }

    protected abstract apply(wallet: Wallet): void;
    protected abstract revert(wallet: Wallet): void;

    /**
     * Misc
     */
    protected verify(): boolean {
        const { data } = this;
        if (isException(data)) {
            return true;
        }

        if (data.type >= 4) {
            return false;
        }

        return crypto.verify(data);
    }

    public toJson() {
        const data = Object.assign({}, this.data);
        data.amount = +(data.amount as Bignum).toFixed();
        data.fee = +(data.fee as Bignum).toFixed();

        if (data.vendorFieldHex === null) {
            delete data.vendorFieldHex;
        }

        return data;
    }

    public hasVendorField(): boolean {
        return false;
    }

    /**
     * Schema
     */
    public static getSchema(): TransactionSchema {
        throw new NotImplementedError();
    }

    private static validateSchema(data: ITransactionData, strict: boolean): ISchemaValidationResult {
        const { $id } = TransactionRegistry.get(data.type).getSchema();
        return AjvWrapper.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
