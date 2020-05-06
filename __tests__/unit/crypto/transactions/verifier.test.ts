import "jest-extended";

import { TransactionVersionError } from "@arkecosystem/crypto/src/errors";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";
import { CryptoManager, Interfaces, Transactions } from "@packages/crypto/src";

import { createRandomTx } from "./__support__";

let Identities;
let BuilderFactory;
let Verifier;
let crypto: CryptoManager<any>;
let transactionsManager: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionsManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    Identities = crypto.Identities;
    BuilderFactory = transactionsManager.BuilderFactory;
    Verifier = transactionsManager.Verifier;
});

describe("Verifier", () => {
    describe("verify", () => {
        let transaction;
        let otherPublicKey;

        beforeAll(() => {
            transaction = TransactionFactory.initialize()
                .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withVersion(2)
                .withFee(2000)
                .withPassphrase("secret")
                .createOne();

            otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";
        });

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
            const keys = Identities.Keys.fromPassphrase("secret");
            const { data }: any = BuilderFactory.transfer()
                .senderPublicKey(keys.publicKey)
                .recipientId(Identities.Address.fromPublicKey(keys.publicKey))
                .version(2)
                .fee("10")
                .amount("100");

            const hash = transactionsManager.Utils.toHash(data);
            data.signature = crypto.LibraryManager.Crypto.Hash.signECDSA(hash, keys);

            expect(Verifier.verify(data)).toBeTrue();
        });

        // Test each type on it's own
        describe.each([0, 1, 2, 3])("type %s", (type) => {
            it("should be ok", () => {
                const tx = createRandomTx(crypto, BuilderFactory, type);
                expect(tx.verify()).toBeTrue();
            });
        });

        describe("type 4", () => {
            it("should return false if AIP11 is not activated", () => {
                const tx = createRandomTx(crypto, BuilderFactory, 4);
                crypto.MilestoneManager.getMilestone().aip11 = false;
                expect(tx.verify()).toBeFalse();
            });

            it("should return true if AIP11 is activated", () => {
                const tx = createRandomTx(crypto, BuilderFactory, 4);
                crypto.MilestoneManager.getMilestone().aip11 = true;
                expect(tx.verify()).toBeTrue();
                crypto.MilestoneManager.getMilestone().aip11 = false;
            });
        });
    });

    describe("verifySecondSignature", () => {
        let keys2;
        let transaction;
        let otherPublicKey;

        beforeAll(() => {
            keys2 = Identities.Keys.fromPassphrase("secret two");

            transaction = TransactionFactory.initialize()
                .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withVersion(2)
                .withFee(2000)
                .withPassphrase("secret")
                .withSecondPassphrase("secret two")
                .createOne();

            otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";
        });

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
            crypto.MilestoneManager.getMilestone().aip11 = false;

            expect(() => Verifier.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );
        });
    });
});
