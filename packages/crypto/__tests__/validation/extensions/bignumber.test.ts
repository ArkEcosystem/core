import BigNumber from "bignumber.js";
import Joi from "joi";
import { extensions } from "../../../src/validation/extensions";

const validator = Joi.extend(extensions);

let bigNumber;

beforeEach(() => {
    bigNumber = new BigNumber(100);
});

describe("BigNumber validation extension", () => {
    it("passes when validating if only the same number", () => {
        expect(validator.validate(bigNumber, validator.bignumber().only(100)).error).toBe(null);
    });

    it("fails when validating if only a different number", () => {
        expect(validator.validate(bigNumber, validator.bignumber().only(2)).error.details[0].message).toBe(
            '"value" is different from allowed value',
        );
    });

    it("passes when validating if minimum a smaller or equal number", () => {
        expect(validator.validate(bigNumber, validator.bignumber().min(20)).error).toBe(null);

        expect(validator.validate(bigNumber, validator.bignumber().min(100)).error).toBe(null);
    });

    it("fails when validating if minimum a bigger number", () => {
        expect(validator.validate(bigNumber, validator.bignumber().min(500)).error.details[0].message).toBe(
            '"value" is lower than minimum',
        );
    });
});
