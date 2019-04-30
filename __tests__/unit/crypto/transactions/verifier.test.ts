import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { TransactionVersionError } from "@arkecosystem/crypto/src/errors";
import { Keys } from "@arkecosystem/crypto/src/identities";
import { Transaction, TransactionVerifier } from "@arkecosystem/crypto/src/transactions";

describe("Transaction", () => {
    describe("verify", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys.publicKey,
        };
        Transaction.sign(transaction, keys);

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(TransactionVerifier.verifyHash(transaction)).toBeTrue();
        });

        it("should return false on an invalid signature", () => {
            expect(
                TransactionVerifier.verifyHash(Object.assign({}, transaction, { senderPublicKey: otherPublicKey })),
            ).toBeFalse();
        });

        it("should return false on a missing signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.signature;

            expect(TransactionVerifier.verifyHash(transactionWithoutSignature)).toBeFalse();
        });
    });

    describe("verifySecondSignature", () => {
        const keys1 = Keys.fromPassphrase("secret");
        const keys2 = Keys.fromPassphrase("secret too");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys1.publicKey,
        };
        const secondSignature = Transaction.secondSign(transaction, keys2);
        transaction.signSignature = secondSignature;
        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(TransactionVerifier.verifySecondSignature(transaction, keys2.publicKey)).toBeTrue();
        });

        it("should return false on an invalid second signature", () => {
            expect(TransactionVerifier.verifySecondSignature(transaction, otherPublicKey)).toBeFalse();
        });

        it("should return false on a missing second signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.secondSignature;
            delete transactionWithoutSignature.signSignature;

            expect(TransactionVerifier.verifySecondSignature(transactionWithoutSignature, keys2.publicKey)).toBeFalse();
        });

        it("should fail this.getHash for transaction version > 1", () => {
            const transactionV2 = Object.assign({}, transaction, { version: 2 });

            expect(() => TransactionVerifier.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );
        });
    });
});
