import delay from "delay";
import { readdirSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";
import { PinoLogger } from "@packages/core-logger-pino/src";
import { defaults } from "@packages/core-logger-pino/src/defaults";
import { expectLogger } from "../shared/logger";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/container";

expectLogger(PinoLogger, {
    levels: {
        console: "trace",
        file: "trace",
    },
});

describe("filestream", () => {
    afterAll(() => setGracefulCleanup());

    it("should rotate the log 3 times", async () => {
        const app = new Application(new Container());
        app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-jestnet");
        app.useLogPath(dirSync().name);

        const logger = await app.resolve(PinoLogger).make({
            ...defaults,
            fileRotator: { interval: "1s" },
        });

        for (let i = 0; i < 3; i++) {
            logger.info(`Test ${i + 1}`);
            await delay(1000);
        }

        const files = readdirSync(app.logPath());
        expect(files.filter(file => file.endsWith(".log.gz"))).toHaveLength(3);
        expect(files).toHaveLength(5);
    });
});
