import {
    InvalidCriteria,
    UnexpectedError,
    UnsupportedValue,
} from "@packages/core-kernel/src/services/search/errors";

describe("InvalidCriteria", () => {
    it("should create", () => {
        const error = new InvalidCriteria(undefined, undefined, []);
        expect(error.message).toEqual("Invalid criteria 'undefined' (undefined) for undefined value");
    });

    it("should create if value is object", () => {
        const error = new InvalidCriteria({ a: "a" }, undefined, []);
        expect(error.message).toEqual("Invalid criteria 'undefined' (undefined) for Object value");
    });

    it("should create if value is null", () => {
        const error = new InvalidCriteria(null, undefined, []);
        expect(error.message).toEqual("Invalid criteria 'undefined' (undefined) for null value");
    });

    it("should create if criteria is object", () => {
        const error = new InvalidCriteria(undefined, { a: "a" }, []);
        expect(error.message).toEqual("Invalid criteria '[object Object]' (Object) for undefined value");
    });

    it("should create if criteria is null", () => {
        const error = new InvalidCriteria(undefined, null, []);
        expect(error.message).toEqual("Invalid criteria 'null' for undefined value");
    });

    it("should create if path is defined", () => {
        const error = new InvalidCriteria(undefined, undefined, ["part1", "part2"]);
        expect(error.message).toEqual("Invalid criteria 'undefined' (undefined) at 'part1.part2' for undefined value");
    });
});

describe("UnsupportedValue", () => {
    it("should create if value is undefined", () => {
        const error = new UnsupportedValue(undefined, []);
        expect(error.message).toEqual("Unsupported value 'undefined' (undefined)");
    });

    it("should create if value is array", () => {
        const error = new UnsupportedValue([], []);
        expect(error.message).toEqual("Unsupported value Array(0)");
    });

    it("should create if value is object", () => {
        const error = new UnsupportedValue({ a: "a" }, []);
        expect(error.message).toEqual("Unsupported value '[object Object]' (Object)");
    });

    it("should create if value is null", () => {
        const error = new UnsupportedValue(null, []);
        expect(error.message).toEqual("Unsupported value 'null'");
    });
    it("should create if path is defined", () => {
        const error = new UnsupportedValue(undefined, ["part1", "part2"]);
        expect(error.message).toEqual("Unsupported value 'undefined' (undefined) at 'part1.part2'");
    });
});

describe("UnexpectedError", () => {
    it("should create if path is empty", () => {
        const error = new UnexpectedError(new Error("test"), []);
        expect(error.message).toEqual("Unexpected error 'test' (Error)");
    });

    it("should create if path is defined", () => {
        const error = new UnexpectedError(new Error("test"), ["part1", "part2"]);
        expect(error.message).toEqual("Unexpected error 'test' (Error) at 'part1.part2'");
    });
});
