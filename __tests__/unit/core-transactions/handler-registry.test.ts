import "jest-extended";

import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Errors, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { Registry, TransactionHandler } from "../../../packages/core-transactions/src/handlers";
import { TransactionHandlerConstructor } from "../../../packages/core-transactions/src/handlers/transaction";
import { TransferTransactionHandler } from "../../../packages/core-transactions/src/handlers/transfer";

import { DeactivatedTransactionHandlerError } from "../../../packages/core-transactions/src/errors";
import { testnet } from "../../../packages/crypto/src/networks";

const { transactionBaseSchema, extend } = Transactions.schemas;
const { TransactionType } = Enums;
const { Slots } = Crypto;

const TEST_TRANSACTION_TYPE = 100;

class TestTransaction extends Transactions.Transaction {
    public static type: number = TEST_TRANSACTION_TYPE;
    public static typeGroup: number = Enums.TransactionTypeGroup.Test;
    public static key: string = "test";

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
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toFixed());
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
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        return;
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return TestTransaction;
    }

    public async apply(transaction: Transactions.Transaction, walletManager: State.IWalletManager): Promise<void> {
        return;
    }
    public async revert(transaction: Transactions.Transaction, wallet: State.IWalletManager): Promise<void> {
        return;
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        return null;
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}

beforeAll(() => {
    // @ts-ignore
    testnet.milestones[0].fees.staticFees.test = 1234;

    Managers.configManager.setConfig(testnet);
    Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet
});

describe("Registry", () => {
    const NUMBER_OF_CORE_TRANSACTIONS: number = Object.keys(Enums.TransactionType).length / 2;

    it("should register core transaction types", async () => {
        await expect(
            Promise.all([
                Registry.get(TransactionType.Transfer),
                Registry.get(TransactionType.SecondSignature),
                Registry.get(TransactionType.DelegateRegistration),
                Registry.get(TransactionType.Vote),
                Registry.get(TransactionType.MultiSignature),
                Registry.get(TransactionType.Ipfs),
                Registry.get(TransactionType.HtlcLock),
                Registry.get(TransactionType.HtlcClaim),
                Registry.get(TransactionType.HtlcRefund),
                Registry.get(TransactionType.MultiPayment),
            ]),
        ).toResolve();
    });

    it("should register a custom type", async () => {
        expect(() => Registry.registerTransactionHandler(TestTransactionHandler)).not.toThrowError();
        await expect(Registry.get(TEST_TRANSACTION_TYPE, Enums.TransactionTypeGroup.Test)).resolves.toBeInstanceOf(
            TestTransactionHandler,
        );
        expect(Transactions.TransactionTypeFactory.get(TEST_TRANSACTION_TYPE, Enums.TransactionTypeGroup.Test)).toBe(
            TestTransaction,
        );
        expect(() => Registry.deregisterTransactionHandler(TestTransactionHandler)).not.toThrowError();
    });

    it("should be able to instantiate a custom transaction", () => {
        Registry.registerTransactionHandler(TestTransactionHandler);

        const keys = Identities.Keys.fromPassphrase("secret");
        const data: Interfaces.ITransactionData = {
            version: 2,
            typeGroup: Enums.TransactionTypeGroup.Test,
            type: TEST_TRANSACTION_TYPE,
            nonce: Utils.BigNumber.ONE,
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

        expect(() => Registry.deregisterTransactionHandler(TestTransactionHandler)).not.toThrowError();
    });

    it("should throw when trying to deregister a Core transaction type", () => {
        expect(() => Registry.deregisterTransactionHandler(TransferTransactionHandler)).toThrowError();
    });

    it("should throw when registering the same key twice", async () => {
        TestTransaction.key = "transfer";
        expect(() => Registry.registerTransactionHandler(TestTransactionHandler)).toThrowError(
            Errors.TransactionKeyAlreadyRegisteredError,
        );
        TestTransaction.key = "test";
    });

    it("should return all bootstrapped transaction handlers", () => {
        const handlers = Registry.getAll();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS);
    });

    it("should return all activated transactions", async () => {
        let handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS);

        Registry.registerTransactionHandler(TestTransactionHandler);

        handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS + 1);

        jest.spyOn(
            await Registry.get(TEST_TRANSACTION_TYPE, Enums.TransactionTypeGroup.Test),
            "isActivated",
        ).mockResolvedValueOnce(false);

        handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS);

        handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS + 1);

        Registry.deregisterTransactionHandler(TestTransactionHandler);
    });

    it("should only return V1 transactions when AIP11 is off", async () => {
        Managers.configManager.getMilestone().aip11 = false;

        let handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(5);

        Managers.configManager.getMilestone().aip11 = true;

        handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS);
    });

    it("should not find the transaction type on typeGroup mismatch", async () => {
        Registry.registerTransactionHandler(TestTransactionHandler);

        const handlers = await Registry.getActivatedTransactionHandlers();
        expect(handlers).toHaveLength(NUMBER_OF_CORE_TRANSACTIONS + 1);

        await expect(Registry.get(TEST_TRANSACTION_TYPE)).rejects.toThrowError();
        await expect(Registry.get(TEST_TRANSACTION_TYPE, Enums.TransactionTypeGroup.Test)).toResolve();
    });

    it("should throw when trying to use a deactivated transaction type", async () => {
        Managers.configManager.getMilestone().aip11 = false;

        await expect(Registry.get(TransactionType.Ipfs)).rejects.toThrowError(DeactivatedTransactionHandlerError);

        Managers.configManager.getMilestone().aip11 = true;

        await expect(Registry.get(TransactionType.Ipfs)).toResolve();
    });
});
