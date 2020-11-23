import "jest-extended";

import { Managers, Utils, Validation } from "../../../../packages/crypto";
import { TransactionType } from "../../../../packages/crypto/src/enums";

const ajv = Validation.validator.getInstance();

describe("keyword maxBytes", () => {
    it("should be ok", () => {
        const schema = { type: "string", maxBytes: 64 };
        const validate = ajv.compile(schema);

        expect(validate("1234")).toBeTrue();
        expect(validate("a".repeat(64))).toBeTrue();
        expect(validate("a".repeat(65))).toBeFalse();
        expect(validate("⊁".repeat(21))).toBeTrue();
        expect(validate("⊁".repeat(22))).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });
});

describe("keyword network", () => {
    it("should be ok", () => {
        const schema = { network: true };
        const validate = ajv.compile(schema);

        expect(validate(30)).toBeTrue();
        expect(validate(23)).toBeFalse();
        expect(validate("a")).toBeFalse();

        Managers.configManager.setFromPreset("mainnet");

        expect(validate(23)).toBeTrue();
        expect(validate(30)).toBeFalse();

        Managers.configManager.setFromPreset("devnet");

        expect(validate(30)).toBeTrue();
        expect(validate(23)).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });
});

describe("keyword transactionType", () => {
    it("should be ok", () => {
        const schema = { transactionType: TransactionType.Transfer };
        const validate = ajv.compile(schema);

        expect(validate(0)).toBeTrue();
        expect(validate(TransactionType.Vote)).toBeFalse();
        expect(validate(-1)).toBeFalse();
        expect(validate("")).toBeFalse();
        expect(validate("0")).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });
});

describe("keyword blockId", () => {
    it("should be ok", () => {
        const schema = { blockId: {} };
        const validate = ajv.compile(schema);

        expect(validate("1")).toBeTrue();
        expect(validate("1234")).toBeTrue();
        expect(validate("15654541800058894516")).toBeTrue();
        expect(validate("156545418000588945160")).toBeFalse();

        expect(validate("e3b0c44298fc1c14")).toBeTrue();
        expect(validate("e3b0c44298fc1c1")).toBeFalse();
        expect(validate("e3b0c44298fc1c140")).toBeFalse();

        expect(validate("94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb40")).toBeTrue();
        expect(validate("94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4")).toBeFalse();
        expect(validate("94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb400")).toBeFalse();
    });

    it("should not be ok", () => {
        const schema = { blockId: { hex: true } };
        const validate = ajv.compile(schema);

        expect(validate("nein")).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate("")).toBeFalse();
        expect(validate(undefined)).toBeFalse();
        expect(validate(1243)).toBeFalse();
        expect(validate(Utils.BigNumber.make(0))).toBeFalse();
    });

    it("should be ok (genesis)", () => {
        const schema = {
            properties: {
                height: { type: "number" },
                previousBlock: { blockId: { hex: true, allowNullWhenGenesis: true } },
            },
        };

        const validate = ajv.compile(schema);

        expect(validate({ height: 1, previousBlock: "" })).toBeTrue();
        expect(validate({ height: 1, previousBlock: undefined })).toBeTrue();
        expect(validate({ height: 1, previousBlock: 0 })).toBeTrue();
        expect(validate({ height: 1, previousBlock: "1234" })).toBeTrue();

        expect(validate({ height: 1, previousBlock: "abc" })).toBeFalse();
        expect(validate({ height: 1, previousBlock: {} })).toBeFalse();

        expect(validate({ height: 2, previousBlock: "" })).toBeFalse();
        expect(validate({ height: 2, previousBlock: 0 })).toBeFalse();
    });
});

describe("keyword bignumber", () => {
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
        expect(validate("9223372036854775807")).toBeTrue();
        expect(validate("9223372036854775808")).toBeFalse();
    });

    it("should be ok for number, string and bignumber as input", () => {
        const schema = { bignumber: { minimum: 100, maximum: 2000 }, additionalItems: false };
        const validate = ajv.compile(schema);

        for (const value of [100, 1e2, 1020.0, 500, 2000]) {
            expect(validate(value)).toBeTrue();
            expect(validate(String(value))).toBeTrue();
            expect(validate(Utils.BigNumber.make(value))).toBeTrue();
        }

        for (const value of [1e8, 1999.000001, 1 / 1e8, -100, -500, -2000.1]) {
            expect(validate(value)).toBeFalse();
            expect(validate(String(value))).toBeFalse();
        }
    });

    it("should not accept garbage", () => {
        const schema = { bignumber: {} };
        const validate = ajv.compile(schema);

        expect(validate(undefined)).toBeFalse();
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
            expect(data.amount).toBeInstanceOf(Utils.BigNumber);
            expect(data.amount).toEqual(Utils.BigNumber.make(100));
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
            expect(data.amount).toBeInstanceOf(Utils.BigNumber);
            expect(data.amount).toEqual(Utils.BigNumber.make(100));
        });
    });

    describe("bypassGenesis", () => {
        it("should be ok", () => {
            const schema = {
                type: "object",
                properties: {
                    amount: { bignumber: { minimum: 100, bypassGenesis: true } },
                },
            };

            const validate = ajv.compile(schema);
            expect(
                validate({ amount: 0, id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572" }),
            ).toBeTrue();
            expect(
                validate({ amount: 0, id: "affe17fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572" }),
            ).toBeFalse();
            expect(validate({ amount: 0 })).toBeFalse();
        });
    });
});
