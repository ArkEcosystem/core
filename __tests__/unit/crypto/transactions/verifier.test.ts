import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { TransactionVersionError } from "@arkecosystem/crypto/src/errors";
import { Keys } from "@arkecosystem/crypto/src/identities";
import { Signer, Verifier } from "@arkecosystem/crypto/src/transactions";
import { configManager } from "../../../../packages/crypto/src/managers";
import { createRandomTx } from "./__support__";

describe("Verifier", () => {
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
        Signer.sign(transaction, keys);

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(Verifier.verifyHash(transaction)).toBeTrue();
        });

        it("should return false on an invalid signature", () => {
            expect(
                Verifier.verifyHash(Object.assign({}, transaction, { senderPublicKey: otherPublicKey })),
            ).toBeFalse();
        });

        it("should return false on a missing signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.signature;

            expect(Verifier.verifyHash(transactionWithoutSignature)).toBeFalse();
        });

        // Test each type on it's own
        describe.each([0, 1, 2, 3])("type %s", type => {
            it("should be ok", () => {
                const tx = createRandomTx(type);
                expect(tx.verify()).toBeTrue();
            });
        });

        describe("type 4", () => {
            it("should return false if AIP11 is not activated", () => {
                const tx = createRandomTx(4);
                expect(tx.verify()).toBeFalse();
            });

            it("should return true if AIP11 is activated", () => {
                const tx = createRandomTx(4);
                configManager.getMilestone().aip11 = true;
                expect(tx.verify()).toBeTrue();
                configManager.getMilestone().aip11 = false;
            });
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
        const secondSignature = Signer.secondSign(transaction, keys2);
        transaction.signSignature = secondSignature;
        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(Verifier.verifySecondSignature(transaction, keys2.publicKey)).toBeTrue();
        });

        it("should return false on an invalid second signature", () => {
            expect(Verifier.verifySecondSignature(transaction, otherPublicKey)).toBeFalse();
        });

        it("should return false on a missing second signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.secondSignature;
            delete transactionWithoutSignature.signSignature;

            expect(Verifier.verifySecondSignature(transactionWithoutSignature, keys2.publicKey)).toBeFalse();
        });

        it("should fail this.getHash for transaction version > 1", () => {
            const transactionV2 = Object.assign({}, transaction, { version: 2 });

            expect(() => Verifier.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );
        });
    });
});
