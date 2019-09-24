import delay from "delay";
import { readdirSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";
import { PinoLogger } from "@packages/core-kernel/src/services/log/drivers";
import { expectLogger } from "../../../../shared/logger";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

expectLogger(PinoLogger, {
    app: {
        services: {
            log: {
                levels: {
                    console: process.env.CORE_LOG_LEVEL || "emergency",
                    file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
                },
                fileRotator: {
                    interval: "1d",
                },
            },
        },
    },
});

describe("filestream", () => {
    afterAll(() => setGracefulCleanup());

    it("should rotate the log 3 times", async () => {
        const app = new Application(new Container());
        app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-jestnet");
        app.bind(Identifiers.ConfigRepository)
            .to(ConfigRepository)
            .inSingletonScope();
        app.get<ConfigRepository>(Identifiers.ConfigRepository).merge({
            app: {
                services: {
                    log: {
                        levels: {
                            console: process.env.CORE_LOG_LEVEL || "emergency",
                            file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
                        },
                        fileRotator: {
                            interval: "1s",
                        },
                    },
                },
            },
        });
        app.useLogPath(dirSync().name);

        const logger = await app.resolve(PinoLogger).make();

        for (let i = 0; i < 3; i++) {
            logger.info(`Test ${i + 1}`);
            await delay(1000);
        }

        const files = readdirSync(app.logPath());
        expect(files.filter(file => file.endsWith(".log.gz"))).toHaveLength(3);
        expect(files).toHaveLength(5);
    });
});
