// tslint:disable:member-ordering

import { JoiObject } from "joi";
import { TransactionRepository } from "..";
import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import {
    InsufficientBalanceError,
    SecondSignatureVerificationFailedError,
    SenderWalletMismatchError,
    TransactionValidationError,
    UnexpectedMultiSignatureError,
    UnexpectedSecondSignatureError,
} from "../../errors";
import { configManager } from "../../managers";
import { Wallet } from "../../models/wallet";
import { Bignum, isException } from "../../utils";
import { transactionValidator } from "../../validation";
import { TransactionDeserializer } from "../deserializers";
import { ITransactionData } from "../interfaces";
import { TransactionSerializer } from "../serializers";

export abstract class AbstractTransaction {
    public static type: TransactionTypes = null;

    public static fromHex(hex: string): AbstractTransaction {
        const transaction = TransactionDeserializer.deserializeV2(hex);
        transaction.isVerified = transaction.verify();
        return transaction;
    }

    public static from(data: ITransactionData): AbstractTransaction {
        const transaction = TransactionRepository.create(data);

        // TODO:
        // 1. validate schema + sanitize
        // 2. serialize ?
        // 3. deserialize is not necessary anymore if 1) plus crypto.verify are in place

        TransactionSerializer.serializeV2(transaction);
        TransactionDeserializer.deserializeV2(transaction.serialized.toString("hex"));

        transaction.isVerified = transaction.verify();

        return transaction;
    }

    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return AbstractTransaction.type;
    }

    private isVerified: boolean;
    public get verified(): boolean {
        return this.isVerified;
    }

    public data: ITransactionData;
    public serialized: Buffer;

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

        // TODO: this overlaps with schema validation  during creation
        const validationResult = transactionValidator.validate(data);

        if (validationResult.fails) {
            throw new TransactionValidationError(validationResult.fails.message);
        }

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
                throw new SecondSignatureVerificationFailedError();
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

        return data;
    }

    protected hasVendorField(): boolean {
        return false;
    }
}
