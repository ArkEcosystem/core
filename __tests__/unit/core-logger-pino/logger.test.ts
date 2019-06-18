import delay from "delay";
import { readdirSync, removeSync } from "fs-extra";
import { tmpdir } from "os";
import { PinoLogger } from "../../../packages/core-logger-pino/src";
import { defaults } from "../../../packages/core-logger-pino/src/defaults";
import { expectLogger } from "../shared/logger";

expectLogger(
    () =>
        new PinoLogger({
            levels: {
                console: "trace",
                file: "trace",
            },
        }),
);

describe("filestream", () => {
    beforeAll(() => {
        process.env.CORE_PATH_LOG = `${tmpdir()}/core-logger-pino/`;
    });

    beforeEach(() => {
        removeSync(process.env.CORE_PATH_LOG);
    });

    afterEach(() => {
        removeSync(process.env.CORE_PATH_LOG);
    });

    it("should rotate the log 3 times", async () => {
        const logger = new PinoLogger({ ...defaults, fileRotator: { interval: "1s" } }).make();

        for (let i = 0; i < 3; i++) {
            logger.info(`Test ${i + 1}`);
            await delay(1000);
        }

        const files = readdirSync(process.env.CORE_PATH_LOG);
        expect(files.filter(file => file.endsWith(".log.gz"))).toHaveLength(3);
        expect(files).toHaveLength(5);
    });
});
