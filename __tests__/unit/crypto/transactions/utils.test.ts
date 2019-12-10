import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import {
    InvalidTransactionBytesError,
    TransactionTypeError,
    TransactionVersionError,
} from "../../../../packages/crypto/src/errors";
import { Keys } from "../../../../packages/crypto/src/identities";
import { ITransaction, ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import {
    BuilderFactory,
    Transaction,
    TransactionFactory,
    Utils as TransactionUtils,
} from "../../../../packages/crypto/src/transactions";
import { TransactionFactory as TestTransactionFactory } from "../../../helpers/transaction-factory";
import { transaction as transactionDataFixture } from "../fixtures/transaction";

configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

let transactionData: ITransactionData;
let transactionDataJSON;

const createRandomTx = type => {
    let transaction: ITransaction;

    switch (type) {
        case 0: {
            // transfer
            transaction = BuilderFactory.transfer()
                .recipientId("DJLxkgm7JMortrGVh1ZrvDH39XALWLa83e")
                .amount("10000000000000")
                .vendorField(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();
            break;
        }

        case 1: {
            // second signature
            transaction = BuilderFactory.secondSignature()
                .signatureAsset(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 2: {
            // delegate registration
            transaction = BuilderFactory.delegateRegistration()
                .usernameAsset("dummydelegate")
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 3: {
            // vote registration
            transaction = BuilderFactory.vote()
                .votesAsset(["+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760"])
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 4: {
            configManager.getMilestone().aip11 = true;
            const passphrases = [Math.random().toString(36), Math.random().toString(36), Math.random().toString(36)];

            const participants = passphrases.map(passphrase => {
                return Keys.fromPassphrase(passphrase);
            });

            const min = Math.min(1, participants.length);
            const max = Math.max(1, participants.length);

            const multiSigRegistration = BuilderFactory.multiSignature().min(
                Math.floor(Math.random() * (max - min)) + min,
            );

            for (const participant of participants) {
                multiSigRegistration.participant(participant.publicKey);
            }

            multiSigRegistration.senderPublicKey(participants[0].publicKey);

            for (const passphrase of passphrases) {
                multiSigRegistration.multiSign(passphrase, passphrases.indexOf(passphrase));
            }

            transaction = multiSigRegistration.sign(passphrases[0]).build();

            configManager.getMilestone().aip11 = false;
            break;
        }
        default: {
            throw new TransactionTypeError(type);
        }
    }

    return transaction;
};

describe("Transaction", () => {
    beforeEach(() => {
        configManager.setFromPreset("devnet");

        transactionData = { ...transactionDataFixture };
        transactionDataJSON = {
            ...transactionData,
            ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
        };
    });

    describe("toBytes / fromBytes", () => {
        it("should verify all transactions", () => {
            for (let i = 0; i < 3; i++) {
                const transaction = createRandomTx(i);
                const newTransaction = TransactionFactory.fromBytes(TransactionUtils.toBytes(transaction.data));

                // TODO: Remove both from data when not needed
                delete transaction.data.signSignature;
                if (transaction.data.recipientId === undefined) {
                    delete transaction.data.recipientId;
                }

                // @TODO: double check
                if (!transaction.data.secondSignature) {
                    delete transaction.data.secondSignature;
                }

                if (transaction.data.version === 1) {
                    delete transaction.data.typeGroup;
                    delete transaction.data.nonce;
                }

                // @ts-ignore
                transaction.data.amount = Utils.BigNumber.make(transaction.data.amount).toFixed();
                // @ts-ignore
                transaction.data.fee = Utils.BigNumber.make(transaction.data.fee).toFixed();

                expect(newTransaction.toJson()).toMatchObject(transaction.data);
                expect(newTransaction.verified).toBeTrue();
            }
        });

        it("should create a transaction", () => {
            const hex = TransactionUtils.toBytes(transactionData).toString("hex");
            const transaction = TransactionFactory.fromHex(hex);
            expect(transaction).toBeInstanceOf(Transaction);
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });

        it("should throw when getting garbage", () => {
            expect(() => TransactionFactory.fromBytes(undefined)).toThrow(InvalidTransactionBytesError);
            expect(() => TransactionFactory.fromBytes(Buffer.from("garbage"))).toThrow(InvalidTransactionBytesError);
            expect(() => TransactionFactory.fromHex(undefined)).toThrow(InvalidTransactionBytesError);
            expect(() => TransactionFactory.fromHex("affe")).toThrow(InvalidTransactionBytesError);
        });

        it("should throw when getting an unsupported version", () => {
            configManager.setFromPreset("testnet");

            const transaction = BuilderFactory.transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("1000")
                .vendorField(Math.random().toString(36))
                .nonce("1")
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();

            let hex = transaction.serialized.toString("hex");
            hex = hex.slice(0, 2) + "04" + hex.slice(4);
            expect(() => TransactionFactory.fromHex(hex)).toThrow(TransactionVersionError);

            configManager.setFromPreset("devnet");
        });
    });

    describe("getHash", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            configManager.setFromPreset("testnet");

            transaction = TestTransactionFactory.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withFee(2000)
                .withPassphrase("secret")
                .withVersion(2)
                .createOne();
        });

        it("should return Buffer and Buffer most be 32 bytes length", () => {
            const result = TransactionUtils.toHash(transaction);
            expect(result).toBeObject();
            expect(result).toHaveLength(32);
            expect(result.toString("hex")).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported versions", () => {
            expect(() => TransactionUtils.toHash(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("getId", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            configManager.setFromPreset("testnet");

            transaction = TestTransactionFactory.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withFee(2000)
                .withPassphrase("secret")
                .withVersion(2)
                .createOne();
        });

        it("should return string id and be equal to 27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c", () => {
            const id = TransactionUtils.getId(transaction); // old id
            expect(id).toBeString();
            expect(id).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported version", () => {
            expect(() => TransactionUtils.getId(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });
});
