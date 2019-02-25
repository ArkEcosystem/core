import "jest-extended";

import { SATOSHI } from "../../../../../packages/crypto/src/constants";
import { DelegateRegistrationHandler } from "../../../../../packages/crypto/src/handlers/transactions/delegate-registration";
import { DelegateResignationHandler } from "../../../../../packages/crypto/src/handlers/transactions/delegate-resignation";
import { Handler } from "../../../../../packages/crypto/src/handlers/transactions/handler";
import { SecondSignatureHandler } from "../../../../../packages/crypto/src/handlers/transactions/second-signature";
import { TransferHandler } from "../../../../../packages/crypto/src/handlers/transactions/transfer";
import { VoteHandler } from "../../../../../packages/crypto/src/handlers/transactions/vote";
import { configManager } from "../../../../../packages/crypto/src/managers";
import { Bignum } from "../../../../../packages/crypto/src/utils";

let wallet;
let transaction;
let transactionWithSecondSignature;
let errors;

class FakeHandler extends Handler {
    // tslint:disable-next-line:no-shadowed-variable
    public apply(wallet: any, transaction: any) {
        throw new Error("Method not implemented.");
    }

    // tslint:disable-next-line:no-shadowed-variable
    public revert(wallet: any, transaction: any) {
        throw new Error("Method not implemented.");
    }
}

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

describe("Specific handler - fake handler tests", () => {
    const handler = new FakeHandler();
    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canApply(wallet, transaction, errors)).toBeTrue();
            expect(errors).toHaveLength(0);
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();

            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be true if the transaction has a second signature but wallet does not, when ignoreInvalidSecondSignatureField=true", () => {
            configManager.getMilestone().ignoreInvalidSecondSignatureField = true;

            expect(handler.canApply(wallet, transactionWithSecondSignature, errors)).toBeTrue();
        });
    });
});

describe.each([
    ["Transfer handler", TransferHandler],
    ["Vote handler", VoteHandler],
    ["Delegate registration handler", DelegateRegistrationHandler],
    ["Delegate resignation handler", DelegateResignationHandler],
    ["Second signature handler", SecondSignatureHandler],
    ["Fake handler", FakeHandler],
])("Commmon handler tests - %s", (handlerDesc, TransactionHandler) => {
    const handler = new TransactionHandler();
    describe("canApply", () => {
        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            transaction.senderPublicKey = "a".repeat(66);
            const result = handler.canApply(wallet, transaction, errors);

            expect(result).toBeFalse();
            expect(errors).toContain('wallet "publicKey" does not match transaction "senderPublicKey"');
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            delete configManager.getMilestone().ignoreInvalidSecondSignatureField;

            expect(handler.canApply(wallet, transactionWithSecondSignature, errors)).toBeFalse();
            expect(errors).toContain("Invalid second-signature field");
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.secondPublicKey = "invalid-public-key";

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain(
                handlerDesc === "Second signature handler"
                    ? "Wallet already has a second signature"
                    : "Failed to verify second-signature",
            );
        });

        it("should be false if the validation fails", () => {
            delete transaction.senderPublicKey;

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain('child "senderPublicKey" fails because ["senderPublicKey" is required]');
        });

        it("should be false if wallet has not enough balance", () => {
            wallet.balance = transaction.amount.plus(transaction.fee).minus(1); // 1 satoshi short

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });

    describe("applyTransactionToSender", () => {
        it("should be ok", () => {
            handler.apply = jest.fn();

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee));
        });

        it("should not be ok", () => {
            handler.apply = jest.fn();

            transaction.senderPublicKey = "a".repeat(66);

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });

        it("should not fail due to case mismatch", () => {
            handler.apply = jest.fn();

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).minus(transaction.amount).minus(transaction.fee));
        });
    });

    describe("revertTransactionForSender", () => {
        it("should be ok", () => {
            handler.revert = jest.fn();

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.revertTransactionForSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee));
        });

        it("should not be ok", () => {
            handler.revert = jest.fn();

            transaction.senderPublicKey = "a".repeat(66);

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.revertTransactionForSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });

        it("should not fail due to case mismatch", () => {
            handler.revert = jest.fn();

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();

            handler.revertTransactionForSender(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount).plus(transaction.fee));
        });
    });

    describe("applyTransactionToRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.applyTransactionToRecipient(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance).plus(transaction.amount));
        });

        it("should not be ok", () => {
            transaction.recipientId = "invalid-recipientId";

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.applyTransactionToRecipient(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });
    });

    describe("revertTransactionForRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.revertTransactionForRecipient(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance - transaction.amount));
        });

        it("should not be ok", () => {
            transaction.recipientId = "invalid-recipientId";

            const initialBalance = 1000 * SATOSHI;
            wallet.balance = new Bignum(initialBalance);

            handler.revertTransactionForRecipient(wallet, transaction);

            expect(wallet.balance).toEqual(new Bignum(initialBalance));
        });
    });
});
