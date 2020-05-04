import "jest-extended";

import { CryptoManager, Interfaces, TransactionsManager } from "@packages/crypto/src";
import {
    InvalidTransactionBytesError,
    TransactionSchemaError,
    UnkownTransactionError,
} from "@packages/crypto/src/errors";
import { ITransactionData } from "@packages/crypto/src/interfaces";
import { Transaction } from "@packages/crypto/src/transactions/types/transaction";

import { buildTransaction as transactionFixture } from "../fixtures/transaction";
import { buildTransaction as transactionDataFixture } from "../fixtures/transaction";
import { createRandomTx } from "./__support__";

let transactionData: ITransactionData;
let transactionDataJSON;

const expectTransaction = (bigNumberConstructor, { data }): void => {
    // TODO: check that the extra fields don't matter here
    // These seem to be added:
    // "secondSignature": undefined
    // "typeGroup": 1
    expect(data).toEqual(expect.objectContaining(transactionFixture(bigNumberConstructor)));
};

let TransactionFactoryDevNet;
let Serializer;
let TransactionUtils;
let cryptoManagerDevNet: CryptoManager<any>;
let BuilderFactory;

let transactionJson: Interfaces.ITransactionJson;
let transactionSerialized: Buffer;
let transaction: Interfaces.ITransaction<ITransactionData, any>;

beforeEach(() => {
    cryptoManagerDevNet = CryptoManager.createFromPreset("devnet");

    const transactionsManager = new TransactionsManager(cryptoManagerDevNet, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    TransactionFactoryDevNet = transactionsManager.TransactionFactory;
    Serializer = transactionsManager.Serializer;
    TransactionUtils = transactionsManager.Utils;
    BuilderFactory = transactionsManager.BuilderFactory;

    transactionData = { ...transactionDataFixture(cryptoManagerDevNet.LibraryManager.Libraries.BigNumber) };
    transactionDataJSON = {
        ...transactionData,
        ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
    };

    transaction = TransactionFactoryDevNet.fromData(
        transactionFixture(cryptoManagerDevNet.LibraryManager.Libraries.BigNumber),
    );
    transactionJson = transaction.toJson();

    transactionSerialized = Serializer.serialize(transaction);
});

describe("TransactionFactory", () => {
    describe(".fromHex", () => {
        it("should pass to create a transaction from hex", () => {
            expectTransaction(
                cryptoManagerDevNet.LibraryManager.Libraries.BigNumber,
                TransactionFactoryDevNet.fromHex(transactionSerialized.toString("hex")),
            );
        });

        it("should fail to create a transaction from hex that contains malformed bytes", () => {
            expect(() => TransactionFactoryDevNet.fromHex("deadbeef")).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe(".fromBytes", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(
                cryptoManagerDevNet.LibraryManager.Libraries.BigNumber,
                TransactionFactoryDevNet.fromBytes(transactionSerialized),
            );
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactoryDevNet.fromBytes(Buffer.from("deadbeef"))).toThrowError(
                InvalidTransactionBytesError,
            );
        });
    });

    describe(".fromBytesUnsafe", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(
                cryptoManagerDevNet.LibraryManager.Libraries.BigNumber,
                TransactionFactoryDevNet.fromBytesUnsafe(transactionSerialized),
            );
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => TransactionFactoryDevNet.fromBytesUnsafe(Buffer.from("deadbeef"))).toThrowError(
                InvalidTransactionBytesError,
            );
        });

        // Old tests
        it("should be ok", () => {
            const bytes = TransactionUtils.toBytes(transactionData);
            const id = transactionData.id;

            const transaction = TransactionFactoryDevNet.fromBytesUnsafe(bytes, id);
            expect(transaction).toBeInstanceOf(Transaction);
            delete transactionDataJSON.typeGroup;
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });
    });

    describe(".fromData", () => {
        let validatedTransactionFactory;
        beforeEach(() => {
            const transactionsManager = new TransactionsManager(cryptoManagerDevNet, {
                extendTransaction: () => {},
                // @ts-ignore
                validate: (error, data) => ({ error, value: data }),
            });
            validatedTransactionFactory = transactionsManager.TransactionFactory;
        });
        it("should pass to create a transaction from an object", () => {
            expectTransaction(
                cryptoManagerDevNet.LibraryManager.Libraries.BigNumber,
                TransactionFactoryDevNet.fromData(transaction.data),
            );
        });

        it("should fail to create a transaction from an object that contains malformed data", () => {
            expect(() =>
                validatedTransactionFactory.fromData({
                    ...transaction.data,
                    ...{ fee: cryptoManagerDevNet.LibraryManager.Libraries.BigNumber.make(0) },
                }),
            ).toThrowError(TransactionSchemaError);
        });

        // Old tests
        it("should match transaction id", () => {
            [0, 1, 2, 3]
                // @ts-ignore
                .map((type) => createRandomTx(cryptoManagerDevNet, BuilderFactory, type))
                .forEach((transaction) => {
                    const originalId = transaction.data.id;
                    const newTransaction = TransactionFactoryDevNet.fromData(transaction.data);
                    expect(newTransaction.data.id).toEqual(originalId);
                });
        });

        it("should throw when getting garbage", () => {
            expect(() => validatedTransactionFactory.fromData({} as ITransactionData)).toThrow(UnkownTransactionError);
            expect(() => validatedTransactionFactory.fromData({ type: 0 } as ITransactionData)).toThrow(
                TransactionSchemaError,
            );
        });
    });

    describe(".fromJson", () => {
        let validatedTransactionFactory;
        beforeEach(() => {
            const transactionsManager = new TransactionsManager(cryptoManagerDevNet, {
                extendTransaction: () => {},
                // @ts-ignore
                validate: (error, data) => ({ error, value: data }),
            });
            validatedTransactionFactory = transactionsManager.TransactionFactory;
        });

        it("should pass to create a transaction from JSON", () => {
            expectTransaction(
                cryptoManagerDevNet.LibraryManager.Libraries.BigNumber,
                TransactionFactoryDevNet.fromJson(transactionJson),
            );
        });

        it("should fail to create a transaction from JSON that contains malformed data", () => {
            expect(() =>
                validatedTransactionFactory.fromJson({
                    ...transactionJson,
                    ...{ senderPublicKey: "something" },
                }),
            ).toThrowError(TransactionSchemaError);
        });
    });
});
