import "jest-extended";

import { Database } from "@packages/core-manager/src/database/database";
import { GenerateLog } from "@packages/core-manager/src/workers/actions/generate-log";
import { createReadStream } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";
import zlib from "zlib";

jest.mock("@packages/core-manager/src/database/database");

const mockIterator = {};
mockIterator[Symbol.iterator] = function* () {
    yield { timestamp: 1607948405, level: "info", content: "log message" };
};

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
        const generateLog = new GenerateLog({
            databaseFilePath: "path/to/db",
            schema: { tables: [] },
            logFileName: "test.log.gz",
            query: {},
        });

        expect(spyOnBoot).toHaveBeenCalled();

        await generateLog.execute();

        expect(spyOnGetAllIterator).toHaveBeenCalled();

        const stream = createReadStream(join(process.env.CORE_PATH_DATA!, "log-archive", "test.log.gz")).pipe(
            zlib.createGunzip(),
        );

        await new Promise((resolve) => {
            stream.on("readable", () => {
                resolve();
            });
        });

        expect(stream.read().toString()).toEqual("[2020-12-14 12:20:05.000] INFO : log message\n");
    });
});
