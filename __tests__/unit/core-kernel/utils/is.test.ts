import "jest-extended";
import {
    isUndefined,
    isNil,
    isEmpty,
    isObject,
    isFunction,
    isString,
    isConstructor,
    isSymbol,
    isArrayOfType,
    isNumberArray,
    isStringArray,
    isBooleanArray,
} from "../../../../packages/core-kernel/src/utils/is";

describe(".isUndefined", () => {
    it("should pass", () => {
        expect(isUndefined(undefined)).toBeTrue();
    });

    it("should fail", () => {
        expect(isUndefined("undefined")).toBeFalse();
    });
});

describe(".isNil", () => {
    it("should pass", () => {
        expect(isNil(undefined)).toBeTrue();
        expect(isNil(null)).toBeTrue();
    });

    it("should fail", () => {
        expect(isNil("undefined")).toBeFalse();
        expect(isNil("null")).toBeFalse();
    });
});

describe(".isEmpty", () => {
    it("should pass", () => {
        expect(isEmpty([])).toBeTrue();
    });

    it("should fail", () => {
        expect(isEmpty([1])).toBeFalse();
    });
});

describe(".isObject", () => {
    it("should pass", () => {
        expect(isObject({ key: "value" })).toBeTrue();
    });

    it("should fail", () => {
        expect(isObject(1)).toBeFalse();
    });
});

describe(".isFunction", () => {
    it("should pass", () => {
        expect(isFunction(new Function())).toBeTrue();
    });

    it("should fail", () => {
        expect(isFunction([])).toBeFalse();
    });
});

describe(".isString", () => {
    it("should pass", () => {
        expect(isString("string")).toBeTrue();
    });

    it("should fail", () => {
        expect(isString(1)).toBeFalse();
    });
});

describe(".isConstructor", () => {
    it("should pass", () => {
        expect(isConstructor(Date)).toBeTrue();
    });

    it("should fail", () => {
        expect(isConstructor([])).toBeFalse();
    });
});

describe(".isSymbol", () => {
    it("should pass", () => {
        expect(isSymbol(Symbol.for("string"))).toBeTrue();
    });

    it("should fail", () => {
        expect(isSymbol("string")).toBeFalse();
    });
});

describe(".isArrayOfType", () => {
    it("should pass", () => {
        expect(isArrayOfType<number>([1], "number")).toBeTrue();
    });

    it("should fail", () => {
        expect(isArrayOfType<number>(["string"], "number")).toBeFalse();
    });
});

describe(".isNumberArray", () => {
    it("should pass", () => {
        expect(isNumberArray([1])).toBeTrue();
    });

    it("should fail", () => {
        expect(isNumberArray(["string"])).toBeFalse();
    });
});

describe(".isStringArray", () => {
    it("should pass", () => {
        expect(isStringArray(["string"])).toBeTrue();
    });

    it("should fail", () => {
        expect(isStringArray([1])).toBeFalse();
    });
});

describe(".isBooleanArray", () => {
    it("should pass", () => {
        expect(isBooleanArray([true])).toBeTrue();
    });

    it("should fail", () => {
        expect(isBooleanArray([1])).toBeFalse();
    });
});
