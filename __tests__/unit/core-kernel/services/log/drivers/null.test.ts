import { NullLogger } from "../../../../../../packages/core-kernel/src/services/log/drivers/null";

describe("NullLogger.make", () => {
    it("should return instance itself", async () => {
        const driver = new NullLogger();
        const result = await driver.make();
        expect(result).toBe(driver);
    });
});

describe("NullLogger.emergency", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.emergency("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.alert", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.alert("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.critical", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.critical("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.error", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.error("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.warning", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.warning("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.notice", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.notice("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.info", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.info("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.debug", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.debug("message");
        expect(result).toBe(undefined);
    });
});

describe("NullLogger.suppressConsoleOutput", () => {
    it("should return undefined", () => {
        const driver = new NullLogger();
        const result = driver.suppressConsoleOutput(true);
        expect(result).toBe(undefined);
    });
});
