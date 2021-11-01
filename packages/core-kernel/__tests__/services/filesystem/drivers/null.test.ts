import { NullFilesystem } from "../../../../../../packages/core-kernel/src/services/filesystem/drivers/null";

describe("NullFilesystem.make", () => {
    it("should return instance itself", async () => {
        const driver = new NullFilesystem();
        const result = await driver.make();
        expect(result).toBe(driver);
    });
});

describe("NullFilesystem.exists", () => {
    it("should return false", async () => {
        const driver = new NullFilesystem();
        const result = await driver.exists("filename");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.get", () => {
    it("should return empty buffer", async () => {
        const driver = new NullFilesystem();
        const result = await driver.get("filename");
        expect(result).toStrictEqual(new Buffer(0));
    });
});

describe("NullFilesystem.put", () => {
    it("should return false", async () => {
        const driver = new NullFilesystem();
        const result = await driver.put("filename", "contents");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.delete", () => {
    it("should return false", async () => {
        const driver = new NullFilesystem();
        const result = await driver.delete("filename");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.copy", () => {
    it("should return false", async () => {
        const driver = new NullFilesystem();
        const result = await driver.copy("filename1", "filename2");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.move", () => {
    it("should return false", async () => {
        const driver = new NullFilesystem();
        const result = await driver.move("filename1", "filename2");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.size", () => {
    it("should return 0", async () => {
        const driver = new NullFilesystem();
        const result = await driver.size("filename");
        expect(result).toBe(0);
    });
});

describe("NullFilesystem.lastModified", () => {
    it("should return 0", async () => {
        const driver = new NullFilesystem();
        const result = await driver.lastModified("filename");
        expect(result).toBe(0);
    });
});

describe("NullFilesystem.files", () => {
    it("should return empty array", async () => {
        const driver = new NullFilesystem();
        const result = await driver.files("dirname");
        expect(result).toStrictEqual([]);
    });
});

describe("NullFilesystem.directories", () => {
    it("should return empty array", async () => {
        const driver = new NullFilesystem();
        const result = await driver.directories("dirname");
        expect(result).toStrictEqual([]);
    });
});

describe("NullFilesystem.makeDirectory", () => {
    it("should return empty array", async () => {
        const driver = new NullFilesystem();
        const result = await driver.makeDirectory("dirname");
        expect(result).toBe(false);
    });
});

describe("NullFilesystem.deleteDirectory", () => {
    it("should return empty array", async () => {
        const driver = new NullFilesystem();
        const result = await driver.deleteDirectory("dirname");
        expect(result).toBe(false);
    });
});
