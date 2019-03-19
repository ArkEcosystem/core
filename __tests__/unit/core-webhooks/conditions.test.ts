import "jest-extended";
import {
    between,
    contains,
    eq,
    falsy,
    gt,
    gte,
    lt,
    lte,
    ne,
    notBetween,
    regexp,
    truthy,
} from "../../../packages/core-webhooks/src/conditions";

describe("Conditions - between", () => {
    it("should be true", () => {
        expect(
            between(1.5, {
                min: 1,
                max: 2,
            }),
        ).toBeTrue();
    });

    it("should be false", () => {
        expect(
            between(3, {
                min: 1,
                max: 2,
            }),
        ).toBeFalse();
    });
});

describe("Conditions - contains", () => {
    it("should be true", () => {
        expect(contains("Hello World", "Hello")).toBeTrue();
    });

    it("should be false", () => {
        expect(contains("Hello World", "invalid")).toBeFalse();
    });
});

describe("Conditions - equal", () => {
    it("should be true", () => {
        expect(eq(1, 1)).toBeTrue();
    });

    it("should be false", () => {
        expect(eq(1, 2)).toBeFalse();
    });
});

describe("Conditions - falsy", () => {
    it("should be true", () => {
        expect(falsy(false)).toBeTrue();
    });

    it("should be false", () => {
        expect(falsy(true)).toBeFalse();
    });
});

describe("Conditions - greater than", () => {
    it("should be true", () => {
        expect(gt(2, 1)).toBeTrue();
    });

    it("should be false", () => {
        expect(gt(1, 2)).toBeFalse();
    });
});

describe("Conditions - greater than or equal", () => {
    it("should be true", () => {
        expect(gte(2, 1)).toBeTrue();
        expect(gte(2, 2)).toBeTrue();
    });

    it("should be false", () => {
        expect(gte(1, 2)).toBeFalse();
    });
});

describe("Conditions - less than", () => {
    it("should be true", () => {
        expect(lt(1, 2)).toBeTrue();
    });

    it("should be false", () => {
        expect(lt(2, 1)).toBeFalse();
    });
});

describe("Conditions - less than or equal", () => {
    it("should be true", () => {
        expect(lte(1, 2)).toBeTrue();
        expect(lte(1, 1)).toBeTrue();
    });

    it("should be false", () => {
        expect(lte(2, 1)).toBeFalse();
    });
});

describe("Conditions - not equal", () => {
    it("should be true", () => {
        expect(ne(1, 2)).toBeTrue();
    });

    it("should be false", () => {
        expect(ne(1, 1)).toBeFalse();
    });
});

describe("Conditions - not-between", () => {
    it("should be true", () => {
        expect(
            notBetween(3, {
                min: 1,
                max: 2,
            }),
        ).toBeTrue();
    });

    it("should be false", () => {
        expect(
            notBetween(1.5, {
                min: 1,
                max: 2,
            }),
        ).toBeFalse();
    });
});

describe("Conditions - regexp", () => {
    it("should be true", () => {
        expect(regexp("hello world!", "hello")).toBeTrue();
    });

    it("should be false", () => {
        expect(regexp(123, "w+")).toBeFalse();
    });
});

describe("Conditions - truthy", () => {
    it("should be true", () => {
        expect(truthy(true)).toBeTrue();
    });

    it("should be false", () => {
        expect(truthy(false)).toBeFalse();
    });
});
