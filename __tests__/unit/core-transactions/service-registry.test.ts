import "jest-extended";

import { Database } from "@arkecosystem/core-interfaces";
import {
    configManager,
    constants,
    crypto,
    ITransactionData,
    schemas,
    slots,
    Transaction,
    TransactionConstructor,
    TransactionRegistry,
} from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { errors, TransactionService, TransactionServiceRegistry } from "../../../packages/core-transactions/src";

const { transactionBaseSchema, extend } = schemas;
const { TransactionTypes } = constants;

const TEST_TRANSACTION_TYPE = 100;

class TestTransaction extends Transaction {
    public static type = TEST_TRANSACTION_TYPE;

    public static getSchema(): schemas.TransactionSchema {
        return extend(transactionBaseSchema, {
            $id: "test",
            required: ["recipientId", "amount"],
            properties: {
                type: { transactionType: TEST_TRANSACTION_TYPE },
                recipientId: { $ref: "address" },
            },
        });
    }

    public serialize(): ByteBuffer {
        return new ByteBuffer();
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}

// tslint:disable-next-line:max-classes-per-file
class TestTransactionService extends TransactionService {
    public getConstructor(): TransactionConstructor {
        return TestTransaction;
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }
    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        return;
    }
}

beforeAll(() => {
    configManager.setFromPreset("testnet");
});

afterEach(() => {
    TransactionServiceRegistry.deregisterCustomTransactionService(TEST_TRANSACTION_TYPE);
});

describe("TransactionServiceRegistry", () => {
    it("should register core transaction types", () => {
        expect(() => {
            TransactionServiceRegistry.get(TransactionTypes.Transfer);
            TransactionServiceRegistry.get(TransactionTypes.SecondSignature);
            TransactionServiceRegistry.get(TransactionTypes.DelegateRegistration);
            TransactionServiceRegistry.get(TransactionTypes.Vote);
            TransactionServiceRegistry.get(TransactionTypes.MultiSignature);
        }).not.toThrow(errors.InvalidTransactionTypeError);
    });

    it("should register a custom type", () => {
        expect(() =>
            TransactionServiceRegistry.registerCustomTransactionService(TestTransactionService),
        ).not.toThrowError();

        expect(TransactionServiceRegistry.get(TEST_TRANSACTION_TYPE)).toBeInstanceOf(TestTransactionService);
        expect(TransactionRegistry.get(TEST_TRANSACTION_TYPE)).toBe(TestTransaction);
    });

    it("should be able to instantiate a custom transaction", () => {
        TransactionServiceRegistry.registerCustomTransactionService(TestTransactionService);

        const keys = crypto.getKeys("secret");
        const data: ITransactionData = {
            type: TEST_TRANSACTION_TYPE,
            timestamp: slots.getTime(),
            senderPublicKey: keys.publicKey,
            fee: "10000000",
            amount: "200000000",
            recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
        };

        data.signature = crypto.sign(data, keys);
        data.id = crypto.getId(data);

        const transaction = Transaction.fromData(data);
        expect(transaction).toBeInstanceOf(TestTransaction);
        expect(transaction.verified).toBeTrue();
    });

    it("should not be ok when registering the same type again", () => {
        expect(() =>
            TransactionServiceRegistry.registerCustomTransactionService(TestTransactionService),
        ).not.toThrowError(errors.TransactionServiceAlreadyRegisteredError);

        expect(() => TransactionServiceRegistry.registerCustomTransactionService(TestTransactionService)).toThrowError(
            errors.TransactionServiceAlreadyRegisteredError,
        );
    });
});
