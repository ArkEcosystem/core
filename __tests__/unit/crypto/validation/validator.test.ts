import "jest-extended";
import Joi from "joi";
import { Bignum } from "../../../../packages/crypto/src";
import { Validator } from "../../../../packages/crypto/src/validation/validator";

describe("Validator", () => {
    describe("validate", () => {
        it("should validate a simple number", async () => {
            Validator.init();

            const schema = {
                a: Joi.number(),
            };

            const value = {
                a: 123,
            };

            const result = await Validator.validate(value, schema);
            expect(result).toEqual(value);
        });

        it("should validate using extended schemas", async () => {
            Validator.init();

            const schema = {
                a: Validator.joi.bignumber(),
            };

            const value = {
                a: new Bignum(12),
            };

            const result = await Validator.validate(value, schema);
            expect(result).toEqual(value);
        });

        it("should return an error if an error was thrown", () => {
            Validator.joi = {
                validate: () => {
                    throw new Error("erreur");
                },
            };
            const result = Validator.validate("", "");
            expect(result.error).toBeDefined();
        });
    });
});
