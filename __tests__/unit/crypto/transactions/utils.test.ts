import "jest-extended";

import * as Generators from "../../../../packages/core-test-framework/src/app/generators";
import { TransactionFactory as TestTransactionFactory } from "../../../../packages/core-test-framework/src/utils/transaction-factory";
import { CryptoManager, Interfaces, Transactions } from "../../../../packages/crypto/src";
import {
    InvalidTransactionBytesError,
    TransactionTypeError,
    TransactionVersionError,
} from "../../../../packages/crypto/src/errors";
import { ITransaction, ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { Transaction } from "../../../../packages/crypto/src/transactions";
import { buildTransaction as transactionDataFixture } from "../fixtures/transaction";

let transactionData: ITransactionData;
let transactionDataJSON;

let Keys;
let Utils;
let BuilderFactory;
let TransactionFactory;

const createRandomTx = (type) => {
    let transaction: ITransaction<Interfaces.ITransactionData, any>;

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
            const passphrases = [Math.random().toString(36), Math.random().toString(36), Math.random().toString(36)];

            const participants = passphrases.map((passphrase) => {
                return Keys.fromPassphrase(passphrase);
            });

            const min = Math.min(1, participants.length);
            const max = Math.max(1, participants.length);

            const multiSigRegistration = BuilderFactory.multiSignature().min(
                Math.floor(Math.random() * (max - min)) + min,
            );

            participants.forEach((participant) => {
                multiSigRegistration.participant(participant.publicKey);
            });

            multiSigRegistration.senderPublicKey(participants[0].publicKey);

            passphrases.forEach((passphrase, index) => {
                multiSigRegistration.multiSign(passphrase, index);
            });

            transaction = multiSigRegistration.sign(passphrases[0]).build();

            break;
        }
        default: {
            throw new TransactionTypeError(type);
        }
    }

    return transaction;
};

let crypto: CryptoManager<any>;
let transactionsManager: Transactions.TransactionManager<any, Interfaces.ITransactionData, any>;
let cryptoFromConfigRaw: CryptoManager<any>;
let transactionsManagerConfigRaw: Transactions.TransactionManager<any, Interfaces.ITransactionData, any>;

describe("Transaction", () => {
    beforeEach(() => {
        crypto = CryptoManager.createFromPreset("devnet");

        transactionsManager = new Transactions.TransactionManager(crypto, {
            extendTransaction: () => {},
            // @ts-ignore
            validate: (_, data) => ({
                value: data,
            }),
        });

        Keys = crypto.Identities.Keys;
        Utils = transactionsManager.TransactionTools.Utils;
        BuilderFactory = transactionsManager.BuilderFactory;
        TransactionFactory = transactionsManager.TransactionFactory;

        transactionData = { ...transactionDataFixture(crypto.LibraryManager.Libraries.BigNumber) };
        transactionDataJSON = {
            ...transactionData,
            ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
        };

        cryptoFromConfigRaw = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

        transactionsManagerConfigRaw = new Transactions.TransactionManager(cryptoFromConfigRaw, {
            extendTransaction: () => {},
            // @ts-ignore
            validate: (_, data) => ({
                value: data,
            }),
        });
    });

    describe("toBytes / fromBytes", () => {
        it("should verify all transactions", () => {
            [0, 1, 2, 3]
                .map((type) => createRandomTx(type))
                .forEach((transaction) => {
                    const newTransaction = TransactionFactory.fromBytes(Utils.toBytes(transaction.data));

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
                    transaction.data.amount = cryptoFromConfigRaw.LibraryManager.Libraries.BigNumber.make(
                        transaction.data.amount,
                    ).toFixed();
                    // @ts-ignore
                    transaction.data.fee = cryptoFromConfigRaw.LibraryManager.Libraries.BigNumber.make(
                        transaction.data.fee,
                    ).toFixed();

                    expect(newTransaction.toJson()).toMatchObject(transaction.data);
                    expect(newTransaction.verified).toBeTrue();
                });
        });

        it("should create a transaction", () => {
            const hex = Utils.toBytes(transactionData).toString("hex");
            const transaction = TransactionFactory.fromHex(hex);
            expect(transaction).toBeInstanceOf(Transaction);
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });

        it("should throw when getting garbage", () => {
            expect(() => TransactionFactory.fromBytes(undefined)).toThrow(TypeError);
            expect(() => TransactionFactory.fromBytes(Buffer.from("garbage"))).toThrow(InvalidTransactionBytesError);
            expect(() => TransactionFactory.fromHex(undefined)).toThrow(InvalidTransactionBytesError);
            expect(() => TransactionFactory.fromHex("affe")).toThrow(InvalidTransactionBytesError);
        });

        it("should throw when getting an unsupported version", () => {
            const transaction = transactionsManagerConfigRaw.BuilderFactory.transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("1000")
                .vendorField(Math.random().toString(36))
                .nonce("1")
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();

            let hex = transaction.serialized.toString("hex");
            hex = hex.slice(0, 2) + "04" + hex.slice(4);
            expect(() => transactionsManagerConfigRaw.TransactionFactory.fromHex(hex)).toThrow(
                InvalidTransactionBytesError,
            );
        });
    });

    describe("getHash", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            transaction = TestTransactionFactory.initialize(cryptoFromConfigRaw as any)
                .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withFee(2000)
                .withPassphrase("secret")
                .withVersion(2)
                .createOne();
        });

        it("should return Buffer and Buffer most be 32 bytes length", () => {
            const result = transactionsManagerConfigRaw.TransactionTools.Utils.toHash(transaction);
            expect(result).toBeObject();
            expect(result).toHaveLength(32);
            expect(result.toString("hex")).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported versions", () => {
            expect(() => Utils.toHash(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("getId", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            transaction = TestTransactionFactory.initialize(cryptoFromConfigRaw as any)
                .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withFee(2000)
                .withPassphrase("secret")
                .withVersion(2)
                .createOne();
        });

        it("should return string id and be equal to 27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c", () => {
            const id = transactionsManagerConfigRaw.TransactionTools.Utils.getId(transaction); // old id
            expect(id).toBeString();
            expect(id).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported version", () => {
            expect(() => Utils.getId(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });
});
