import "jest-extended";

import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";

import { CryptoManager, Transactions } from "../../../../packages/crypto/src";
import { TransactionVersionError } from "../../../../packages/crypto/src/errors";

describe("Signer", () => {
    let Keys;
    let Signer;
    let cryptoManager;

    beforeAll(() => {
        cryptoManager = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

        const transactionsManagerRawConfig = new Transactions.TransactionsManager(cryptoManager, {
            extendTransaction: () => {},
            // @ts-ignore
            validate: (_, data) => ({
                value: data,
            }),
        });
        Signer = transactionsManagerRawConfig.Signer;
        Keys = cryptoManager.Identities.Keys;
    });

    describe("sign", () => {
        let keys;
        let transaction;

        beforeAll(() => {
            keys = Keys.fromPassphrase("secret");
            transaction = TransactionFactory.initialize()
                .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
                .withVersion(2)
                .withFee(2000)
                .withPassphrase("secret")
                .createOne();
        });

        it("should return a valid signature", () => {
            const signature = Signer.sign(transaction, keys);
            expect(signature).toBe(
                "b12442fa9a692ba0a2b76492a584a07a5e715891d58f5c1f11255af47544164b1f6a038a319074e5edc5336bd412eca4b54ebf27f39a76b18a14e92fbcdb2084",
            );
        });

        it("should throw for unsupported versions", () => {
            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 110 }), keys);
            }).toThrow(TransactionVersionError);
        });

        it("should sign version 2 if aip11 milestone is true", () => {
            cryptoManager.MilestoneManager.getMilestone().aip11 = false;

            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).toThrow(TransactionVersionError);

            cryptoManager.MilestoneManager.getMilestone().aip11 = true;

            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).not.toThrow(TransactionVersionError);
        });
    });
});
