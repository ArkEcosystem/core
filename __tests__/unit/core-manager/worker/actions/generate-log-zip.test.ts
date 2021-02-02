import "jest-extended";

import { Database } from "@packages/core-manager/src/database/database";
import { GenerateLogZip } from "@packages/core-manager/src/workers/actions/generate-log-zip";
import { existsSync } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

jest.mock("@packages/core-manager/src/database/database");

const mockLogArray = [{ timestamp: 1607948405, level: "info", content: "log message" }];
const mockIterator = mockLogArray[Symbol.iterator]();

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
        // @ts-ignore
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
});
