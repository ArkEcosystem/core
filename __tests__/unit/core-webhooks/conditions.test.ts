import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Conditions } from "@packages/core-webhooks/src/conditions";

let conditionsInstance;
beforeAll(() => {
    const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

    conditionsInstance = new Conditions(crypto.CryptoManager);
});

// TODO: Add test for decimal comparison
// TODO: fix bignumber decimal comparison
describe("Conditions - between", () => {
    // it("should be true", () => {
    //     expect(
    //         conditionsInstance.between(1.5, {
    //             min: 1,
    //             max: 2,
    //         }),
    //     ).toBeTrue();
    //     expect(
    //         conditionsInstance.between("1.5", {
    //             min: "1",
    //             max: "2",
    //         }),
    //     ).toBeTrue();
    // });

    it("should be true", () => {
        expect(
            conditionsInstance.between(2, {
                min: 1,
                max: 3,
            }),
        ).toBeTrue();
        expect(
            conditionsInstance.between("2", {
                min: "1",
                max: "3",
            }),
        ).toBeTrue();
    });

    it("should be false", () => {
        expect(
            conditionsInstance.between(3, {
                min: 1,
                max: 2,
            }),
        ).toBeFalse();
        expect(
            conditionsInstance.between("3", {
                min: "1",
                max: "2",
            }),
        ).toBeFalse();
    });
});

describe("Conditions - contains", () => {
    it("should be true", () => {
        expect(conditionsInstance.contains("Hello World", "Hello")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.contains("Hello World", "invalid")).toBeFalse();
    });
});

describe("Conditions - equal", () => {
    it("should be true", () => {
        expect(conditionsInstance.eq(1, 1)).toBeTrue();
        expect(conditionsInstance.eq("1", "1")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.eq(1, 2)).toBeFalse();
        expect(conditionsInstance.eq("1", "2")).toBeFalse();
    });
});

describe("Conditions - falsy", () => {
    it("should be true", () => {
        expect(conditionsInstance.falsy(false)).toBeTrue();
        expect(conditionsInstance.falsy("false")).toBeTrue();
        expect(conditionsInstance.falsy("FaLsE")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.falsy(true)).toBeFalse();
        expect(conditionsInstance.falsy("true")).toBeFalse();
        expect(conditionsInstance.falsy("TrUe")).toBeFalse();
    });
});

describe("Conditions - greater than", () => {
    it("should be true", () => {
        expect(conditionsInstance.gt(2, 1)).toBeTrue();
        expect(conditionsInstance.gt("2", "1")).toBeTrue();
        expect(conditionsInstance.gt("10", "2")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.gt(1, 2)).toBeFalse();
        expect(conditionsInstance.gt("1", "2")).toBeFalse();
        expect(conditionsInstance.gt("2", "10")).toBeFalse();
        expect(conditionsInstance.gt(undefined, NaN)).toBeFalse();
        expect(conditionsInstance.gt(1, NaN)).toBeFalse();
        expect(conditionsInstance.gt(undefined, 1)).toBeFalse();
        expect(conditionsInstance.gt("null", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("1", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("null", "1")).toBeFalse();
    });
});

describe("Conditions - greater than or equal", () => {
    it("should be true", () => {
        expect(conditionsInstance.gte(2, 1)).toBeTrue();
        expect(conditionsInstance.gte(2, 2)).toBeTrue();
        expect(conditionsInstance.gte("2", "1")).toBeTrue();
        expect(conditionsInstance.gte("2", "2")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.gte(1, 2)).toBeFalse();
        expect(conditionsInstance.gte("1", "2")).toBeFalse();
        expect(conditionsInstance.gt(undefined, NaN)).toBeFalse();
        expect(conditionsInstance.gt(1, NaN)).toBeFalse();
        expect(conditionsInstance.gt(undefined, 1)).toBeFalse();
        expect(conditionsInstance.gt("null", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("1", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("null", "1")).toBeFalse();
    });
});

describe("Conditions - less than", () => {
    it("should be true", () => {
        expect(conditionsInstance.lt(1, 2)).toBeTrue();
        expect(conditionsInstance.lt("1", "2")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.lt(2, 1)).toBeFalse();
        expect(conditionsInstance.lt("2", "1")).toBeFalse();
        expect(conditionsInstance.gt(undefined, NaN)).toBeFalse();
        expect(conditionsInstance.gt(1, NaN)).toBeFalse();
        expect(conditionsInstance.gt(undefined, 1)).toBeFalse();
        expect(conditionsInstance.gt("null", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("1", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("null", "1")).toBeFalse();
    });
});

describe("Conditions - less than or equal", () => {
    it("should be true", () => {
        expect(conditionsInstance.lte(1, 2)).toBeTrue();
        expect(conditionsInstance.lte(1, 1)).toBeTrue();
        expect(conditionsInstance.lte("1", "2")).toBeTrue();
        expect(conditionsInstance.lte("1", "1")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.lte(2, 1)).toBeFalse();
        expect(conditionsInstance.lte("2", "1")).toBeFalse();
        expect(conditionsInstance.gt(undefined, NaN)).toBeFalse();
        expect(conditionsInstance.gt(1, NaN)).toBeFalse();
        expect(conditionsInstance.gt(undefined, 1)).toBeFalse();
        expect(conditionsInstance.gt("null", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("1", "NaN")).toBeFalse();
        expect(conditionsInstance.gt("null", "1")).toBeFalse();
    });
});

describe("Conditions - not equal", () => {
    it("should be true", () => {
        expect(conditionsInstance.ne(1, 2)).toBeTrue();
        expect(conditionsInstance.ne("1", "2")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.ne(1, 1)).toBeFalse();
        expect(conditionsInstance.ne("1", "1")).toBeFalse();
    });
});

describe("Conditions - not-between", () => {
    it("should be true", () => {
        expect(
            conditionsInstance.notBetween(3, {
                min: 1,
                max: 2,
            }),
        ).toBeTrue();
        expect(
            conditionsInstance.notBetween("3", {
                min: "1",
                max: "2",
            }),
        ).toBeTrue();
    });

    it("should be false", () => {
        expect(
            conditionsInstance.notBetween(2, {
                min: 1,
                max: 3,
            }),
        ).toBeFalse();
        expect(
            conditionsInstance.notBetween("2", {
                min: "1",
                max: "3",
            }),
        ).toBeFalse();
    });
});

describe("Conditions - regexp", () => {
    it("should be true", () => {
        expect(conditionsInstance.regexp("hello world!", "hello")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.regexp(123, "w+")).toBeFalse();
    });
});

describe("Conditions - truthy", () => {
    it("should be true", () => {
        expect(conditionsInstance.truthy(true)).toBeTrue();
        expect(conditionsInstance.truthy("true")).toBeTrue();
        expect(conditionsInstance.truthy("TrUe")).toBeTrue();
    });

    it("should be false", () => {
        expect(conditionsInstance.truthy(false)).toBeFalse();
        expect(conditionsInstance.truthy("false")).toBeFalse();
        expect(conditionsInstance.truthy("FaLsE")).toBeFalse();
    });
});
