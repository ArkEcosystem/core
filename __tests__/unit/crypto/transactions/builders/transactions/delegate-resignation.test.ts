import "jest-extended";

import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { Utils } from "../../../../../../packages/crypto/src/transactions";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions/builders";
import { DelegateResignationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { BigNumber } from "../../../../../../packages/crypto/src/utils";

let builder: DelegateResignationBuilder;

describe("Delegate Resignation Transaction", () => {
    describe("verify", () => {
        beforeEach(() => {
            builder = BuilderFactory.delegateResignation();
        });

        it("should be valid with a signature", () => {
            const actual = builder.sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder.sign("dummy passphrase").secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        beforeEach(() => {
            builder = BuilderFactory.delegateResignation();
        });

        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionTypes.DelegateResignation);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.DelegateResignation));
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });

    // FIXME problems with ark-js V1
    describe("getStruct", () => {
        beforeEach(() => {
            builder = BuilderFactory.delegateResignation();
        });

        it("should fail if the transaction is not signed", () => {
            expect(() => builder.getStruct()).toThrow(/transaction.*sign/);
        });

        describe("when is signed", () => {
            beforeEach(() => {
                builder.sign("any pass");
            });

            it("returns the id", () => {
                expect(builder.getStruct().id).toBe(Utils.getId(builder.data));
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
        });
    });
});
