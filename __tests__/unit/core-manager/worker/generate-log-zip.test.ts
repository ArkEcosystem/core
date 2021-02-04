import "jest-extended";

import { Database } from "@packages/core-manager/src/database/database";
import { GenerateLogZip } from "@packages/core-manager/src/workers/generate-log-zip";
import { existsSync } from "fs-extra";
import { join } from "path";
import { Readable, Writable } from "stream";
import { dirSync, setGracefulCleanup } from "tmp";

jest.mock("@packages/core-manager/src/database/database");

const mockLogArray = [{ timestamp: 1607948405, level: "info", content: "log message" }];
const mockIterator = mockLogArray[Symbol.iterator]();

class ReadableError extends Readable {
    public constructor() {
        super({ objectMode: true });
    }

    public _read(size: number) {
        this.emit("error", new Error("Dummy error"));
    }
}

const mockReadable = new ReadableError();

beforeEach(() => {
    setGracefulCleanup();

    process.env.CORE_PATH_TEMP = dirSync().name;
    process.env.CORE_PATH_DATA = dirSync().name;
});

afterAll(() => {
    delete process.env.CORE_PATH_TEMP;
    delete process.env.CORE_PATH_DATA;
});

describe("Generate Log", () => {
    it("should generate log", async () => {
        const spyOnBoot = jest.spyOn(Database.prototype, "boot");
        const spyOnGetAllIterator = jest.spyOn(Database.prototype, "getAllIterator").mockReturnValue(mockIterator);

        // @ts-ignore
        const generateLog = new GenerateLogZip({
            databaseFilePath: "path/to/db",
            schema: { tables: [] },
            logFileName: "test.zip",
            query: {},
        });

        expect(spyOnBoot).toHaveBeenCalled();

        await generateLog.execute();

        expect(spyOnGetAllIterator).toHaveBeenCalled();
        expect(existsSync(join(process.env.CORE_PATH_DATA!, "log-archive", "test.zip"))).toBeTrue();
    });

    it("should destroy socket, remove temp files and throw error on pipeline error", async () => {
        const spyOnBoot = jest.spyOn(Database.prototype, "boot");
        const spyOnGetAllIterator = jest.spyOn(Database.prototype, "getAllIterator").mockReturnValue(mockIterator);
        const spyOnReadableFrom = jest.spyOn(Readable, "from").mockReturnValue(mockReadable);
        const spyOnDestroy = jest.spyOn(Writable.prototype, "destroy");

        // @ts-ignore
        const generateLog = new GenerateLogZip({
            databaseFilePath: "path/to/db",
            schema: { tables: [] },
            logFileName: "test.zip",
            query: {},
        });

        const spyOnMoveArchive = jest.spyOn(generateLog, "moveArchive");

        expect(spyOnBoot).toHaveBeenCalled();

        await expect(generateLog.execute()).rejects.toThrow("Dummy error");
        expect(spyOnGetAllIterator).toHaveBeenCalled();
        expect(spyOnReadableFrom).toHaveBeenCalled();
        expect(spyOnDestroy).toHaveBeenCalled();
        expect(existsSync(join(process.env.CORE_PATH_TEMP!, "log-archive", "test.zip"))).toBeFalse();
        expect(existsSync(join(process.env.CORE_PATH_DATA!, "log-archive", "test.zip"))).toBeFalse();

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 200);
        });

        expect(spyOnMoveArchive).not.toHaveBeenCalled();
    });
});
