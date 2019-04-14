import "jest-extended";

import { client } from "../../../../../../packages/crypto/src/client";
import { crypto } from "../../../../../../packages/crypto/src/crypto/crypto";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { DelegateRegistrationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-registration";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";

let builder: DelegateRegistrationBuilder;

describe("Delegate Registration Transaction", () => {
    describe("verify", () => {
        beforeEach(() => {
            builder = client.getBuilder().delegateRegistration();
        });

        it("should be valid with a signature", () => {
            const actual = builder.usernameAsset("homer").sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .usernameAsset("homer")
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        beforeEach(() => {
            builder = client.getBuilder().delegateRegistration();
        });

        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionTypes.DelegateRegistration);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.DelegateRegistration));
            expect(builder).toHaveProperty("data.recipientId", null);
            expect(builder).toHaveProperty("data.senderPublicKey", null);
            expect(builder).toHaveProperty("data.asset", { delegate: {} });
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });

    describe("usernameAsset", () => {
        beforeEach(() => {
            builder = client.getBuilder().delegateRegistration();
        });
        it("establishes the username of the asset", () => {
            builder.usernameAsset("homer");
            expect(builder.data.asset.delegate.username).toBe("homer");
        });
    });

    // FIXME problems with ark-js V1
    describe("getStruct", () => {
        beforeEach(() => {
            builder = client
                .getBuilder()
                .delegateRegistration()
                .usernameAsset("homer");
        });

        it("should fail if the transaction is not signed", () => {
            expect(() => builder.getStruct()).toThrow(/transaction.*sign/);
        });

        describe("when is signed", () => {
            beforeEach(() => {
                builder.sign("any pass");
            });

            it("returns the id", () => {
                expect(builder.getStruct().id).toBe(
                    // @ts-ignore
                    crypto.getId(builder.data).toString("hex"),
                );
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
