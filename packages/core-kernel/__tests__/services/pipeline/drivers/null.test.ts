import { NullPipeline } from "../../../../../../packages/core-kernel/src/services/pipeline/drivers/null";

describe("NullPipeline.pipe", () => {
    it("should return new piped pipeline", () => {
        const driver = new NullPipeline();
        const result = driver.pipe(() => {});
        expect(result).not.toBe(driver);
        expect(result).toBeInstanceOf(NullPipeline);
    });
});

describe("NullPipeline.process", () => {
    it("should return undefined", async () => {
        const driver = new NullPipeline();
        const result = await driver.process("payload");
        expect(result).toBe(undefined);
    });
});

describe("NullPipeline.processSync", () => {
    it("should return undefined", () => {
        const driver = new NullPipeline();
        const result = driver.processSync("payload");
        expect(result).toBe(undefined);
    });
});
