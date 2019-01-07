import "jest-extended";
import Joi from "joi";
import { validator } from "../../src/validation";

beforeEach(() => {
    // reset
    validator.validate("", null);
});

describe("Validator", () => {
    describe("passes", () => {
        it("should be true", () => {
            validator.results = {
                passes: true,
            };

            expect(validator.passes()).toBeTrue();
        });

        it("should be false", () => {
            validator.results = {
                passes: false,
            };

            expect(validator.passes()).toBeFalse();
        });
    });

    describe("fails", () => {
        it("should be true", () => {
            validator.results = {
                fails: true,
            };

            expect(validator.fails()).toBeTrue();
        });

        it("should be false", () => {
            validator.results = {
                fails: false,
            };

            expect(validator.fails()).toBeFalse();
        });
    });

    describe("validated", () => {
        it("should be true", () => {
            validator.results = {
                data: {
                    key: "value",
                },
            };

            expect(validator.validated()).toHaveProperty("key", "value");
        });

        it("should be false", () => {
            validator.results = {
                data: {
                    invalidKey: "value",
                },
            };

            expect(validator.validated()).not.toHaveProperty("key", "value");
        });
    });

    describe("extend", () => {
        it("should add the given method", () => {
            expect(validator.rules).not.toHaveProperty("fake");

            validator.extend("fake", "news");

            expect(validator.rules).toHaveProperty("fake");
        });
    });

    describe("validate with Rule", () => {
        it("should be true", () => {
            validator.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN", "address");

            expect(validator.passes()).toBeTrue();
        });

        it("should be false", () => {
            validator.validate("_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_", "address");

            expect(validator.errors()).not.toBeEmpty();
            expect(validator.passes()).toBeFalse();
        });

        it("should throw with empty rule", async () => {
            try {
                const result = await validator.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN", "");
            } catch (e) {
                expect(e).toEqual(new Error("An invalid set of rules was provided."));
            }
        });
    });

    describe("validate with Function", () => {
        it("should be true", () => {
            validator.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN", value => ({
                data: value,
                passes: value.length === 34,
                fails: value.length !== 34,
            }));

            expect(validator.passes()).toBeTrue();
        });

        it("should be false", () => {
            validator.validate("_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_", value => ({
                data: value,
                passes: value.length === 34,
                fails: value.length !== 34,
            }));

            expect(validator.passes()).toBeFalse();
        });
    });

    describe("validate with Joi", () => {
        it("should be true", () => {
            validator.validate(
                "DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN",
                Joi.string()
                    .alphanum()
                    .length(34)
                    .required(),
            );

            expect(validator.passes()).toBeTrue();
        });

        it("should be false", () => {
            validator.validate(
                "_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_",
                Joi.string()
                    .alphanum()
                    .length(34)
                    .required(),
            );

            expect(validator.passes()).toBeFalse();
        });
    });

    describe("validate without rules", () => {
        it("should be false", async () => {
            const result = await validator.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN", null);
            expect(result).toBeFalse();
        });

        it("should be null", () => {
            expect(validator.results).toBeNull();
        });
    });
});
