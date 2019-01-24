import "jest-extended";
import Joi from "joi";
import { Bignum } from "../../dist";
import { Engine } from "../../src/validation/engine";

describe("Engine", () => {
    describe("validate", () => {
        it("should validate a simple number", async () => {
            Engine.init();

            const schema = {
                a: Joi.number(),
            };

            const value = {
                a: 123,
            };

            const result = await Engine.validate(value, schema);
            expect(result).toEqual(value);
        });

        it("should validate using extended schemas", async () => {
            Engine.init();

            const schema = {
                a: Engine.joi.bignumber(),
            };

            const value = {
                a: new Bignum(12),
            };

            const result = await Engine.validate(value, schema);
            expect(result).toEqual(value);
        });

        it("should return an error if an error was thrown", () => {
            Engine.joi = {
                validate: () => {
                    throw new Error("erreur");
                },
            };
            const result = Engine.validate("", "");
            expect(result.error).toBeDefined();
        });
    });
});
