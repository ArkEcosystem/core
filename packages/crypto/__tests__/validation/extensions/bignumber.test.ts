import BigNumber from "bignumber.js";
import { JoiWrapper } from "../../../src/validation";

const shouldPass = value => expect(value.error).toBeNull();
const shouldFail = (value, message) => expect(value.error.details[0].message).toBe(`"value" ${message}`);

const joi = JoiWrapper.instance();

let bigNumber;

beforeEach(() => {
    bigNumber = new BigNumber(100);
});

describe("BigNumber validation extension", () => {
    it("passes when validating if only the same number", () => {
        shouldPass(joi.validate(bigNumber, joi.bignumber().only(100)));
    });

    it("fails when validating if only a different number", () => {
        shouldFail(joi.validate(bigNumber, joi.bignumber().only(2)), "is different from allowed value");
    });

    it("passes when validating if minimum a smaller or equal number", () => {
        shouldPass(joi.validate(bigNumber, joi.bignumber().min(20)));

        shouldPass(joi.validate(bigNumber, joi.bignumber().min(100)));
    });

    it("should not accept garbage", () => {
        expect(joi.validate(null, joi.bignumber().integer()).error).not.toBeNull();
        expect(joi.validate({}, joi.bignumber().integer()).error).not.toBeNull();
        expect(joi.validate(/d+/, joi.bignumber().integer()).error).not.toBeNull();
    });

    describe("min", () => {
        it("should pass", () => {
            shouldPass(joi.validate(new BigNumber(1), joi.bignumber().min(1)));
        });

        it("should fail", () => {
            shouldFail(joi.validate(new BigNumber(1), joi.bignumber().min(2)), "is less than minimum");
        });
    });

    describe("max", () => {
        it("should pass", () => {
            shouldPass(joi.validate(new BigNumber(1), joi.bignumber().max(2)));
        });

        it("should fail", () => {
            shouldFail(joi.validate(new BigNumber(2), joi.bignumber().max(1)), "is greater than maximum");
        });
    });

    describe("only", () => {
        it("should pass", () => {
            shouldPass(joi.validate(new BigNumber(0), joi.bignumber().only(0)));
        });

        it("should fail", () => {
            shouldFail(joi.validate(new BigNumber(0), joi.bignumber().only(1)), "is different from allowed value");
        });
    });

    describe("integer", () => {
        it("should pass", () => {
            shouldPass(joi.validate(new BigNumber(1), joi.bignumber().integer()));
        });

        it("should fail", () => {
            shouldFail(joi.validate(new BigNumber(123.456), joi.bignumber().integer()), "is not an integer");
        });
    });

    describe("positive", () => {
        it("should pass", () => {
            shouldPass(joi.validate(new BigNumber(1), joi.bignumber().positive()));
        });

        it("should fail", () => {
            shouldFail(joi.validate(new BigNumber(-1), joi.bignumber().positive()), "is not positive");
        });
    });

    describe("convert", () => {
        it("should convert number to Bignumber", () => {
            const { value, error } = joi.validate(1000, joi.bignumber().integer());
            expect(error).toBeNull();
            expect(value).toBeInstanceOf(BigNumber);
            expect(value).toEqual(new BigNumber(1000));
        });

        it("should convert string to Bignumber", () => {
            const { value, error } = joi.validate("1000", joi.bignumber().integer());
            expect(error).toBeNull();
            expect(value).toBeInstanceOf(BigNumber);
            expect(value).toEqual(new BigNumber(1000));
        });
    });
});
