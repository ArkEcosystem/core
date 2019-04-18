import "jest-extended";

import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { errors, TransactionHandler, TransactionHandlerRegistry } from "../../../packages/core-transactions/src";
import { testnet } from "../../../packages/crypto/src/networks";

const { transactionBaseSchema, extend } = Transactions.schemas;
const { TransactionTypes } = Enums;
const { crypto, slots } = Crypto;

const TEST_TRANSACTION_TYPE = 100;

class TestTransaction extends Transactions.Transaction {
    public static type = TEST_TRANSACTION_TYPE;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return extend(transactionBaseSchema, {
            $id: "test",
            required: ["recipientId", "amount", "asset"],
            properties: {
                type: { transactionType: TEST_TRANSACTION_TYPE },
                recipientId: { $ref: "address" },
                asset: {
                    type: "object",
                    required: ["test"],
                    properties: {
                        test: {
                            type: "number",
                        },
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(24, true);
        buffer.writeUint64(+data.amount);
        buffer.writeUint32(data.expiration || 0);
        buffer.append(bs58check.decode(data.recipientId));
        buffer.writeInt32(data.asset.test);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = Utils.BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
        data.asset = {
            test: buf.readInt32(),
        };
    }
}

// tslint:disable-next-line:max-classes-per-file
class TestTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return TestTransaction;
    }

    public apply(transaction: Transactions.Transaction, wallet: Database.IWallet): void {
        return;
    }
    public revert(transaction: Transactions.Transaction, wallet: Database.IWallet): void {
        return;
    }

    public canEnterTransactionPool(data: Interfaces.ITransactionData, guard: TransactionPool.IGuard): boolean {
        return true;
    }
}

beforeAll(() => {
    // @ts-ignore
    testnet.milestones[0].fees.staticFees.test = 1234;

    Managers.configManager.setConfig(testnet);
});

afterEach(() => {
    TransactionHandlerRegistry.deregisterCustomTransactionHandler(TestTransactionHandler);
});

describe("TransactionHandlerRegistry", () => {
    it("should register core transaction types", () => {
        expect(() => {
            TransactionHandlerRegistry.get(TransactionTypes.Transfer);
            TransactionHandlerRegistry.get(TransactionTypes.SecondSignature);
            TransactionHandlerRegistry.get(TransactionTypes.DelegateRegistration);
            TransactionHandlerRegistry.get(TransactionTypes.Vote);
            TransactionHandlerRegistry.get(TransactionTypes.MultiSignature);
        }).not.toThrow(errors.InvalidTransactionTypeError);
    });

    it("should register a custom type", () => {
        expect(() =>
            TransactionHandlerRegistry.registerCustomTransactionHandler(TestTransactionHandler),
        ).not.toThrowError();

        expect(TransactionHandlerRegistry.get(TEST_TRANSACTION_TYPE)).toBeInstanceOf(TestTransactionHandler);
        expect(Transactions.TransactionRegistry.get(TEST_TRANSACTION_TYPE)).toBe(TestTransaction);
    });

    it("should be able to instantiate a custom transaction", () => {
        TransactionHandlerRegistry.registerCustomTransactionHandler(TestTransactionHandler);

        const keys = Identities.Keys.fromPassphrase("secret");
        const data: Interfaces.ITransactionData = {
            type: TEST_TRANSACTION_TYPE,
            timestamp: slots.getTime(),
            senderPublicKey: keys.publicKey,
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("200000000"),
            recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
            asset: {
                test: 256,
            },
        };

        data.signature = Transactions.Transaction.sign(data, keys);
        data.id = Transactions.Transaction.getId(data);

        const transaction = Transactions.TransactionFactory.fromData(data);
        expect(transaction).toBeInstanceOf(TestTransaction);
        expect(transaction.verified).toBeTrue();

        const bytes = Transactions.Transaction.toBytes(transaction.data);
        const deserialized = Transactions.TransactionFactory.fromBytes(bytes);
        expect(deserialized.verified);
        expect(deserialized.data.asset.test).toBe(256);
    });

    it("should not be ok when registering the same type again", () => {
        expect(() =>
            TransactionHandlerRegistry.registerCustomTransactionHandler(TestTransactionHandler),
        ).not.toThrowError(errors.TransactionHandlerAlreadyRegisteredError);

        expect(() => TransactionHandlerRegistry.registerCustomTransactionHandler(TestTransactionHandler)).toThrowError(
            errors.TransactionHandlerAlreadyRegisteredError,
        );
    });
});
