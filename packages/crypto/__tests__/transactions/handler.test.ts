import "jest-extended";

import {
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    SecondSignatureRegistrationTransaction,
    Transaction,
    TransferTransaction,
    VoteTransaction,
} from "../../src";
import { ARKTOSHI } from "../../src/constants";
import {
    InsufficientBalanceError,
    SecondSignatureVerificationFailedError,
    SenderWalletMismatchError,
    TransactionSchemaError,
    UnexpectedSecondSignatureError,
} from "../../src/errors";
import { configManager } from "../../src/managers";
import { Bignum } from "../../src/utils/bignum";

let wallet;
let transaction;
let transactionWithSecondSignature;
let errors;

beforeEach(() => {
    wallet = {
        address: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
        balance: new Bignum(4527654310),
        publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
    };

    transaction = {
        id: "65a4f09a3a19d212a65d27de05d1ae7e0c461e088a35499996667f98d2a3897c",
        signature:
            "304402206974568da7c363155decbc20ddc17746a2e7e663901c426f5a41411374cc6d18022052f4353ec93227713f9907f2bb2549e6bc42584b736aa5f9ff36e2c239154648",
        timestamp: 54836734,
        type: 0,
        fee: new Bignum(10000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: new Bignum(10000000),
        recipientId: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
    };

    transactionWithSecondSignature = {
        id: "e3b29bba60d5f1f2aad2087dea44644f166b00ae3db1a16a99b622dc4f3900f8",
        signature:
            "304402206974568da7c363155decbc20ddc17746a2e7e663901c426f5a41411374cc6d18022052f4353ec93227713f9907f2bb2549e6bc42584b736aa5f9ff36e2c239154648",
        signSignature:
            "304402202d0ae57c6a0afb225443b56c6e049cb08df48b5813362f7e11574b96f225738f0220055b5a941cc70100404a7788c57b37e2e806acf58c4284c567dc53477f546540",
        timestamp: 54836734,
        type: 0,
        fee: new Bignum(10000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: new Bignum(10000000),
        recipientId: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
    };

    errors = [];
});

describe("General Tests", () => {
    describe("canBeApplied", () => {
        it("should be true", () => {
            expect(Transaction.fromData(transaction).canBeApplied(wallet)).toBeTrue();
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();
            expect(Transaction.fromData(transaction).canBeApplied(wallet)).toBeTrue();
        });

        it("should be true if the transaction has a second signature but wallet does not, when ignoreInvalidSecondSignatureField=true", () => {
            configManager.getMilestone().ignoreInvalidSecondSignatureField = true;
            expect(Transaction.fromData(transactionWithSecondSignature).canBeApplied(wallet)).toBeTrue();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            const instance = Transaction.fromData(transaction);
            instance.data.senderPublicKey = "a".repeat(66);

            expect(() => instance.canBeApplied(wallet)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            delete configManager.getMilestone().ignoreInvalidSecondSignatureField;

            const instance = Transaction.fromData(transactionWithSecondSignature);
            expect(() => instance.canBeApplied(wallet)).toThrow(UnexpectedSecondSignatureError);
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.secondPublicKey = "invalid-public-key";

            const instance = Transaction.fromData(transaction);
            expect(() => instance.canBeApplied(wallet)).toThrow(SecondSignatureVerificationFailedError);
        });

        it("should be false if the validation fails", () => {
            delete transaction.senderPublicKey;

            expect(() => Transaction.fromData(transaction)).toThrow(TransactionSchemaError);
        });

        it("should be false if wallet has not enough balance", () => {
            // 1 arktoshi short
            wallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            const instance = Transaction.fromData(transaction);
            expect(() => instance.canBeApplied(wallet)).toThrow(InsufficientBalanceError);
        });
    });

    describe("applyTransactionToSender", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.applyToSender(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.data.senderPublicKey = "a".repeat(66);

            instance.applyToSender(wallet);
            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });

        it("should not fail due to case mismatch", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transaction.fromData(transaction);
            wallet.publicKey = wallet.publicKey.toLowerCase();

            instance.applyToSender(wallet);
            expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee));
        });
    });

    describe("revertTransactionForSender", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.revertForSender(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.data.senderPublicKey = "a".repeat(66);
            instance.revertForSender(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });

        it("should not fail due to case mismatch", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transaction.fromData(transaction);
            wallet.publicKey = wallet.publicKey.toLowerCase();

            instance.revertForSender(wallet);
            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee));
        });
    });

    describe("applyTransactionToRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.applyToRecipient(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.data.recipientId = "invalid-recipientId";
            instance.applyToRecipient(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });
    });

    describe("revertTransactionForRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.revertForRecipient(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance - transaction.amount));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * ARKTOSHI;
            wallet.balance = new Bignum(initialBalance);

            const instance = Transaction.fromData(transaction);
            instance.data.recipientId = "invalid-recipientId";
            instance.revertForRecipient(wallet);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });
    });
});
