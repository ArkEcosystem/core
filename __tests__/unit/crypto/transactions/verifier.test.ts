import "jest-extended";

import { Identities } from "@arkecosystem/crypto";
import { Hash } from "@arkecosystem/crypto/src/crypto";
import { TransactionVersionError } from "@arkecosystem/crypto/src/errors";
import { Keys } from "@arkecosystem/crypto/src/identities";
import { BuilderFactory, Utils as TransactionUtils, Verifier } from "@arkecosystem/crypto/src/transactions";
import { configManager } from "../../../../packages/crypto/src/managers";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { createRandomTx } from "./__support__";

describe("Verifier", () => {
    beforeEach(() => {
        configManager.setFromPreset("testnet");
        configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet
    });

    describe("verify", () => {
        const transaction = TransactionFactory.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
            .withVersion(2)
            .withFee(2000)
            .withPassphrase("secret")
            .createOne();

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

        it("should verify ECDSA signature for a version 2 transaction", () => {
            const keys = Keys.fromPassphrase("secret");
            const { data }: any = BuilderFactory.transfer()
                .senderPublicKey(keys.publicKey)
                .recipientId(Identities.Address.fromPublicKey(keys.publicKey))
                .version(2)
                .fee("10")
                .amount("100");

            const hash = TransactionUtils.toHash(data);
            data.signature = Hash.signECDSA(hash, keys);

            expect(Verifier.verify(data)).toBeTrue();
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
                configManager.getMilestone().aip11 = false;
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
        const keys2 = Keys.fromPassphrase("secret two");

        const transaction = TransactionFactory.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
            .withVersion(2)
            .withFee(2000)
            .withPassphrase("secret")
            .withSecondPassphrase("secret two")
            .createOne();

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            configManager.getMilestone().aip11 = true;
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
            configManager.getMilestone().aip11 = false;

            expect(() => Verifier.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );

            configManager.getMilestone().aip11 = true;
        });
    });
});
