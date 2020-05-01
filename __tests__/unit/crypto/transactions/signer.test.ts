import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";

import { TransactionVersionError } from "../../../../packages/crypto/src/errors";
import { Keys } from "../../../../packages/crypto/src/identities";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Signer } from "../../../../packages/crypto/src/transactions";

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    configManager.setConfig(Generators.generateCryptoConfigRaw());
});

describe("Signer", () => {
    describe("sign", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction = TransactionFactory.initialize()
            .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
            .withVersion(2)
            .withFee(2000)
            .withPassphrase("secret")
            .createOne();

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
            configManager.getMilestone().aip11 = false;

            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).toThrow(TransactionVersionError);

            configManager.getMilestone().aip11 = true;

            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).not.toThrow(TransactionVersionError);
        });
    });
});
