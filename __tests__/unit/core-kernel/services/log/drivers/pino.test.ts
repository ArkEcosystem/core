import "jest-extended";

import { Logger } from "@packages/core-kernel/src/contracts/kernel/log";
import capcon from "capture-console";

import delay from "delay";
import { readdirSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";
import { PinoLogger } from "@packages/core-kernel/src/services/log/drivers";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let logger: Logger;
let message: string;

let app: Application;
let container: interfaces.Container;

beforeEach(async () => {
    const options = {
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
    };

    container = new Container();

    app = new Application(container);
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-jestnet");
    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();
    app.get<ConfigRepository>(Identifiers.ConfigRepository).merge(options);
    app.bind("path.log").toConstantValue(dirSync().name);

    container.snapshot();

    logger = await app.resolve<Logger>(PinoLogger).make(options);
});

afterEach(() => {
    message = undefined;

    container.restore();
});

beforeAll(() => {
    capcon.startCapture(process.stdout, stdout => (message = stdout.toString()));

    capcon.startCapture(process.stderr, stderr => (message = stderr.toString()));

    // @ts-ignore
    capcon.startCapture(console._stdout, stdout => (message = stdout.toString()));

    // @ts-ignore
    capcon.startCapture(console._stderr, stderr => (message = stderr.toString()));
});

afterAll(() => setGracefulCleanup());

describe("Logger", () => {
    it("should not be logged if empty", () => {
        logger.info(undefined);

        expect(message).toBeUndefined();
    });

    it("should modify the message if it is not a string", () => {
        logger.info(["Hello World"]);

        expect(message.trim()).toBeString();
    });

    it("should log a message with the [emergency] level", () => {
        logger.emergency("emergency_message");

        expect(message).toMatch(/emergency/);
        expect(message).toMatch(/emergency_message/);
    });

    it("should log a message with the [alert] level", () => {
        logger.alert("alert_message");

        expect(message).toMatch(/alert/);
        expect(message).toMatch(/alert_message/);
    });

    it("should log a message with the [critical] level", () => {
        logger.critical("critical_message");

        expect(message).toMatch(/critical/);
        expect(message).toMatch(/critical_message/);
    });

    it("should log a message with the [error] level", () => {
        logger.error("error_message");

        expect(message).toMatch(/error/);
        expect(message).toMatch(/error_message/);
    });

    it("should log a message with the [warning] level", () => {
        logger.warning("warning_message");

        expect(message).toMatch(/warning/);
        expect(message).toMatch(/warning_message/);
    });

    it("should log a message with the [notice] level", () => {
        logger.notice("notice_message");

        expect(message).toMatch(/notice/);
        expect(message).toMatch(/notice_message/);
    });

    it("should log a message with the [info] level", () => {
        logger.info("info_message");

        expect(message).toMatch(/info/);
        expect(message).toMatch(/info_message/);
    });

    it("should log a message with the [debug] level", () => {
        logger.debug("debug_message");

        expect(message).toMatch(/debug/);
        expect(message).toMatch(/debug_message/);
    });

    it("should suppress console output", () => {
        logger.suppressConsoleOutput(true);

        logger.info("silent_message");
        expect(message).toBeUndefined();

        logger.suppressConsoleOutput(false);

        logger.info("non_silent_message");
        expect(message).toMatch(/non_silent_message/);
    });

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
