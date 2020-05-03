import "jest-extended";

import { sleep } from "@arkecosystem/utils";
import { Application } from "@packages/core-kernel/src/application";
import { Logger } from "@packages/core-kernel/src/contracts/kernel/log";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { PinoLogger } from "@packages/core-logger-pino/src/driver";
import capcon from "capture-console";
import { readdirSync } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

let logger: Logger;
let message: string;

let app: Application;

beforeEach(async () => {
    app = new Application(new Container());
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
    app.bind("path.log").toConstantValue(dirSync().name);

    logger = await app.resolve<Logger>(PinoLogger).make({
        levels: {
            console: process.env.CORE_LOG_LEVEL || "emergency",
            file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
        },
        fileRotator: {
            interval: "1d",
        },
    });
});

afterEach(() => (message = undefined));

beforeAll(() => {
    capcon.startCapture(process.stdout, (stdout) => (message = stdout.toString()));

    capcon.startCapture(process.stderr, (stderr) => (message = stderr.toString()));

    // @ts-ignore
    capcon.startCapture(console._stdout, (stdout) => (message = stdout.toString()));

    // @ts-ignore
    capcon.startCapture(console._stderr, (stderr) => (message = stderr.toString()));
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

    // TODO: Re-enable tests
    // this passes locally but fails on pipelines
    it.skip("should rotate the log 3 times", async () => {
        const app = new Application(new Container());
        app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
        app.useLogPath(dirSync().name);

        const logger = await app.resolve(PinoLogger).make({
            levels: {
                console: process.env.CORE_LOG_LEVEL || "emergency",
                file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
            },
            fileRotator: {
                interval: "1s",
            },
        });

        for (let i = 0; i < 3; i++) {
            logger.info(`Test ${i + 1}`);

            await sleep(1000);
        }

        const files = readdirSync(app.logPath());
        expect(files.filter((file) => file.endsWith(".log.gz"))).toHaveLength(3);
        expect(files).toHaveLength(5);
    });
});
