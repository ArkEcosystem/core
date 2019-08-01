import "jest-extended";

import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { Errors } from "../../../packages/core-transactions/src";
import { Registry, TransactionHandler } from "../../../packages/core-transactions/src/handlers";

import { testnet } from "../../../packages/crypto/src/networks";

const { transactionBaseSchema, extend } = Transactions.schemas;
const { TransactionTypes } = Enums;
const { Slots } = Crypto;

const TEST_TRANSACTION_TYPE = 100;

class TestTransaction extends Transactions.Transaction {
    public static type = TEST_TRANSACTION_TYPE;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return extend(transactionBaseSchema, {
            $id: "test",
            required: ["recipientId", "asset"],
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
        buffer.append(Utils.Base58.decodeCheck(data.recipientId));
        buffer.writeInt32(data.asset.test);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = Utils.BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = Utils.Base58.encodeCheck(buf.readBytes(21).toBuffer());
        data.asset = {
            test: buf.readInt32(),
        };
    }
}

// tslint:disable-next-line:max-classes-per-file
class TestTransactionHandler extends TransactionHandler {
    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        return;
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return TestTransaction;
    }

    public apply(transaction: Transactions.Transaction, walletManager: State.IWalletManager): void {
        return;
    }
    public async revert(transaction: Transactions.Transaction, wallet: State.IWalletManager): Promise<void> {
        return;
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        return true;
    }

    // tslint:disable-next-line: no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line: no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}

beforeAll(() => {
    // @ts-ignore
    testnet.milestones[0].fees.staticFees.test = 1234;

    Managers.configManager.setConfig(testnet);
});

afterEach(() => {
    Registry.deregisterCustomTransactionHandler(TestTransactionHandler);
});

describe("Registry", () => {
    it("should register core transaction types", () => {
        expect(() => {
            Registry.get(TransactionTypes.Transfer);
            Registry.get(TransactionTypes.SecondSignature);
            Registry.get(TransactionTypes.DelegateRegistration);
            Registry.get(TransactionTypes.Vote);
            Registry.get(TransactionTypes.MultiSignature);
            Registry.get(TransactionTypes.Ipfs);
            Registry.get(TransactionTypes.HtlcLock);
            Registry.get(TransactionTypes.HtlcClaim);
            Registry.get(TransactionTypes.HtlcRefund);
            Registry.get(TransactionTypes.MultiPayment);
        }).not.toThrow(Errors.InvalidTransactionTypeError);
    });

    it("should register a custom type", () => {
        expect(() => Registry.registerCustomTransactionHandler(TestTransactionHandler)).not.toThrowError();
        expect(Registry.get(TEST_TRANSACTION_TYPE)).toBeInstanceOf(TestTransactionHandler);
        expect(Transactions.TransactionTypeFactory.get(TEST_TRANSACTION_TYPE)).toBe(TestTransaction);
    });

    it("should be able to instantiate a custom transaction", () => {
        Registry.registerCustomTransactionHandler(TestTransactionHandler);

        const keys = Identities.Keys.fromPassphrase("secret");
        const data: Interfaces.ITransactionData = {
            type: TEST_TRANSACTION_TYPE,
            timestamp: Slots.getTime(),
            senderPublicKey: keys.publicKey,
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("200000000"),
            recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
            asset: {
                test: 256,
            },
        };

        data.signature = Transactions.Signer.sign(data, keys);
        data.id = Transactions.Utils.getId(data);

        const transaction = Transactions.TransactionFactory.fromData(data);
        expect(transaction).toBeInstanceOf(TestTransaction);
        expect(transaction.verified).toBeTrue();

        const bytes = Transactions.Utils.toBytes(transaction.data);
        const deserialized = Transactions.TransactionFactory.fromBytes(bytes);
        expect(deserialized.verified);
        expect(deserialized.data.asset.test).toBe(256);
    });

    it("should not be ok when registering the same type again", () => {
        expect(() => Registry.registerCustomTransactionHandler(TestTransactionHandler)).not.toThrowError(
            Errors.TransactionHandlerAlreadyRegisteredError,
        );

        expect(() => Registry.registerCustomTransactionHandler(TestTransactionHandler)).toThrowError(
            Errors.TransactionHandlerAlreadyRegisteredError,
        );
    });
});
