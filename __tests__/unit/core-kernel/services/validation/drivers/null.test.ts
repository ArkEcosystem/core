import { NullValidator } from "../../../../../../packages/core-kernel/src/services/validation/drivers/null";

describe("NullValidator.validate", () => {
    it("should return undefined", () => {
        const driver = new NullValidator();
        const result = driver.validate({}, {});
        expect(result).toBe(undefined);
    });
});

describe("NullValidator.passes", () => {
    it("should return false", () => {
        const driver = new NullValidator();
        const result = driver.passes();
        expect(result).toBe(false);
    });
});

describe("NullValidator.fails", () => {
    it("should return true", () => {
        const driver = new NullValidator();
        const result = driver.fails();
        expect(result).toBe(true);
    });
});

describe("NullValidator.failed", () => {
    it("should return empty object", () => {
        const driver = new NullValidator();
        const result = driver.failed();
        expect(result).toStrictEqual({});
    });
});

describe("NullValidator.errors", () => {
    it("should return empty object", () => {
        const driver = new NullValidator();
        const result = driver.errors();
        expect(result).toStrictEqual({});
    });
});

describe("NullValidator.valid", () => {
    it("should return undefined", () => {
        const driver = new NullValidator();
        const result = driver.valid();
        expect(result).toBe(undefined);
    });
});

describe("NullValidator.invalid", () => {
    it("should return empty object", () => {
        const driver = new NullValidator();
        const result = driver.invalid();
        expect(result).toStrictEqual({});
    });
});

describe("NullValidator.attributes", () => {
    it("should return empty object", () => {
        const driver = new NullValidator();
        const result = driver.attributes();
        expect(result).toStrictEqual({});
    });
});
