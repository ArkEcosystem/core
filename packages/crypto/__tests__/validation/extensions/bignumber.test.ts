import "jest-extended";

import { Bignum } from "../../../src/utils";
import { AjvWrapper } from "../../../src/validation";

const ajv = AjvWrapper.instance();

describe("BigNumber validation extension", () => {
    it("should be ok if only one possible value is allowed", () => {
        const schema = { bignumber: { minimum: 100, maximum: 100 } };
        const validate = ajv.compile(schema);

        expect(validate(100)).toBeTrue();
        expect(validate(99)).toBeFalse();
        expect(validate(101)).toBeFalse();
    });

    it("should be ok if above or equal minimum", () => {
        const schema = { bignumber: { minimum: 20 }, additionalItems: false };
        const validate = ajv.compile(schema);

        expect(validate(25)).toBeTrue();
        expect(validate(20)).toBeTrue();
        expect(validate(19)).toBeFalse();
    });

    it("should be ok if above or equal maximum", () => {
        const schema = { bignumber: { maximum: 20 }, additionalItems: false };
        const validate = ajv.compile(schema);

        expect(validate(20)).toBeTrue();
        expect(validate(Number.MAX_SAFE_INTEGER)).toBeFalse();
        expect(validate(25)).toBeFalse();
    });

    it("should not be ok for values bigger than the absolute maximum", () => {
        const schema = { bignumber: {} };
        const validate = ajv.compile(schema);

        expect(validate(Number.MAX_SAFE_INTEGER)).toBeTrue();
        expect(validate(Number.MAX_SAFE_INTEGER + 1)).toBeFalse();
        expect(validate(String(Number.MAX_SAFE_INTEGER) + "100")).toBeFalse();
    });

    it("should be ok for number, string and bignumber as input", () => {
        const schema = { bignumber: { minimum: 100, maximum: 2000 }, additionalItems: false };
        const validate = ajv.compile(schema);

        [100, 1e2, 1020.0, 500, 2000].forEach(value => {
            expect(validate(value)).toBeTrue();
            expect(validate(String(value))).toBeTrue();
            expect(validate(new Bignum(value))).toBeTrue();
        });

        [1e8, 1999.000001, 1 / 1e8, -100, -500, -2000.1].forEach(value => {
            expect(validate(value)).toBeFalse();
            expect(validate(String(value))).toBeFalse();
            expect(validate(new Bignum(value))).toBeFalse();
        });
    });

    it("should not accept garbage", () => {
        const schema = { bignumber: {} };
        const validate = ajv.compile(schema);

        expect(validate(null)).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(/d+/)).toBeFalse();
        expect(validate("")).toBeFalse();
        expect(validate("\u0000")).toBeFalse();
    });

    describe("cast", () => {
        it("should cast number to Bignumber", () => {
            const schema = {
                type: "object",
                properties: {
                    amount: { bignumber: {} },
                },
            };

            const data = {
                amount: 100,
            };

            const validate = ajv.compile(schema);
            expect(validate(data)).toBeTrue();
            expect(data.amount).toBeInstanceOf(Bignum);
            expect(data.amount).toEqual(new Bignum(100));
        });

        it("should cast string to Bignumber", () => {
            const schema = {
                type: "object",
                properties: {
                    amount: { bignumber: {} },
                },
            };

            const data = {
                amount: "100",
            };

            const validate = ajv.compile(schema);
            expect(validate(data)).toBeTrue();
            expect(data.amount).toBeInstanceOf(Bignum);
            expect(data.amount).toEqual(new Bignum(100));
        });
    });
});
