import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { DelegateRegistrationBuilder } from "@packages/crypto/src/transactions/builders/transactions/delegate-registration";
import { Two } from "@packages/crypto/src/transactions/types";

let crypto: CryptoManager<any>;
let builder: DelegateRegistrationBuilder<any, Interfaces.ITransactionData, any>;
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

    builder = transactionsManager.BuilderFactory.delegateRegistration();
});

describe("Delegate Registration Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.usernameAsset("homer").sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder.usernameAsset("homer").sign("dummy passphrase").secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionType.DelegateRegistration);
            expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", Two.DelegateRegistrationTransaction.staticFee(crypto));
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", { delegate: {} });
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });

    describe("usernameAsset", () => {
        it("establishes the username of the asset", () => {
            builder.usernameAsset("homer");
            expect(builder.data.asset.delegate.username).toBe("homer");
        });
    });

    // FIXME problems with ark-js V1
    // note: this will only work with v1 transactions as v2 transactions don't have a timestamp
    describe("getStruct", () => {
        beforeEach(() => {
            builder.usernameAsset("homer");
        });

        it("should fail if the transaction is not signed", () => {
            expect(() => builder.getStruct()).toThrow(/transaction.*sign/);
        });

        describe("when is signed", () => {
            beforeEach(() => {
                crypto.MilestoneManager.getMilestone().aip11 = false;

                builder.version(1).sign("any pass");
            });

            it("returns the id", () => {
                expect(builder.getStruct().id).toBe(transactionsManager.Utils.getId(builder.data));
            });

            it("returns the signature", () => {
                expect(builder.getStruct().signature).toBe(builder.data.signature);
            });

            it("returns the second signature", () => {
                expect(builder.getStruct().secondSignature).toBe(builder.data.secondSignature);
            });

            it("returns the timestamp", () => {
                expect(builder.getStruct().timestamp).toBe(builder.data.timestamp);
            });

            it("returns the transaction type", () => {
                expect(builder.getStruct().type).toBe(builder.data.type);
            });

            it("returns the fee", () => {
                expect(builder.getStruct().fee).toBe(builder.data.fee);
            });

            it("returns the sender public key", () => {
                expect(builder.getStruct().senderPublicKey).toBe(builder.data.senderPublicKey);
            });

            it("returns the amount", () => {
                expect(builder.getStruct().amount).toBe(builder.data.amount);
            });

            it("returns the recipient id", () => {
                expect(builder.getStruct().recipientId).toBe(builder.data.recipientId);
            });

            it("returns the asset", () => {
                expect(builder.getStruct().asset).toBe(builder.data.asset);
            });
        });
    });
});
