import "jest-extended";
import { validator } from "../../src/validation";

beforeEach(() => {
    validator.__reset();
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
});
