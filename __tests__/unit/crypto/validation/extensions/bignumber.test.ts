import BigNumber from "bignumber.js";
import Joi from "joi";
import { extensions } from "../../../../../packages/crypto/src/validation/extensions";

const shouldPass = value => expect(value.error).toBeNull();
const shouldFail = (value, message) => expect(value.error.details[0].message).toBe(`"value" ${message}`);

const validator = Joi.extend(extensions);

let bigNumber;

beforeEach(() => {
    bigNumber = new BigNumber(100);
});

describe("BigNumber validation extension", () => {
    it("passes when validating if only the same number", () => {
        shouldPass(validator.validate(bigNumber, validator.bignumber().only(100)));
    });

    it("fails when validating if only a different number", () => {
        shouldFail(validator.validate(bigNumber, validator.bignumber().only(2)), "is different from allowed value");
    });

    it("passes when validating if minimum a smaller or equal number", () => {
        shouldPass(validator.validate(bigNumber, validator.bignumber().min(20)));

        shouldPass(validator.validate(bigNumber, validator.bignumber().min(100)));
    });

    describe("min", () => {
        it("should pass", () => {
            shouldPass(validator.validate(new BigNumber(1), validator.bignumber().min(1)));
        });

        it("should fail", () => {
            shouldFail(validator.validate(new BigNumber(1), validator.bignumber().min(2)), "is less than minimum");
        });
    });

    describe("max", () => {
        it("should pass", () => {
            shouldPass(validator.validate(new BigNumber(1), validator.bignumber().max(2)));
        });

        it("should fail", () => {
            shouldFail(validator.validate(new BigNumber(2), validator.bignumber().max(1)), "is greater than maximum");
        });
    });

    describe("only", () => {
        it("should pass", () => {
            shouldPass(validator.validate(new BigNumber(0), validator.bignumber().only(0)));
        });

        it("should fail", () => {
            shouldFail(
                validator.validate(new BigNumber(0), validator.bignumber().only(1)),
                "is different from allowed value",
            );
        });
    });

    describe("integer", () => {
        it("should pass", () => {
            shouldPass(validator.validate(new BigNumber(1), validator.bignumber().integer()));
        });

        it("should fail", () => {
            shouldFail(
                validator.validate(new BigNumber(123.456), validator.bignumber().integer()),
                "is not an integer",
            );
        });
    });

    describe("positive", () => {
        it("should pass", () => {
            shouldPass(validator.validate(new BigNumber(1), validator.bignumber().positive()));
        });

        it("should fail", () => {
            shouldFail(validator.validate(new BigNumber(-1), validator.bignumber().positive()), "is not positive");
        });
    });
});
