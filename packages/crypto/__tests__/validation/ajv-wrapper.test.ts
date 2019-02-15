import ajv = require("ajv");
import "jest-extended";
import { TransactionSchema } from "../../src/transactions/types/schemas";
import { AjvWrapper } from "../../src/validation";

describe("AjvWrapper", () => {
    describe("validate", () => {
        describe("publicKey", () => {
            it("should validate a publicKey", () => {
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
            });

            it("should not validate an invalid publicKey", () => {
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "Z34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", "").error).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", null).error).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", undefined).error).not.toBeNull();
            });
        });

        describe("address", () => {
            it("should validate an address", () => {
                expect(AjvWrapper.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).toBeNull();
            });

            it("should not validate an invalid address", () => {
                expect(AjvWrapper.validate("address", "€TRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeNull();
                expect(AjvWrapper.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).not.toBeNull();
                expect(
                    AjvWrapper.validate("address", "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("address", "").error).not.toBeNull();
                expect(AjvWrapper.validate("address", null).error).not.toBeNull();
                expect(AjvWrapper.validate("address", undefined).error).not.toBeNull();
            });
        });
    });

    describe("extend", () => {
        it("should extend transaction schema", () => {
            const customTransactionSchema = { $id: "custom" } as TransactionSchema;
            AjvWrapper.extendTransaction(customTransactionSchema);
            expect(AjvWrapper.instance().getSchema("custom")).not.toBeNull();
        });
    });

    describe("instance", () => {
        it("should return the instance", () => {
            expect(AjvWrapper.instance()).toBeInstanceOf(ajv);
        });
    });
});
