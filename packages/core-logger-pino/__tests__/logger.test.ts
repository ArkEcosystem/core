import { AbstractLogger } from "@arkecosystem/core-logger";
import * as capcon from "capture-console";
import "jest-extended";
import { tmpdir } from "os";
import { PinoLogger } from "../src";

let logger: AbstractLogger;
let message;

beforeAll(() => {
    process.env.CORE_PATH_LOG = tmpdir();

    const driver = new PinoLogger({ level: "trace" });

    logger = driver.make();

    capcon.startCapture(process.stdout, stdout => {
        message += stdout;
    });

    capcon.startCapture(process.stderr, stderr => {
        message += stderr;
    });
});

describe("Logger", () => {
    describe("error", () => {
        it("should log a message", () => {
            logger.error("error_message");

            expect(message).toMatch(/error/);
            expect(message).toMatch(/error_message/);
            message = null;
        });
    });

    describe("warn", () => {
        it("should log a message", () => {
            logger.warn("warning_message");

            expect(message).toMatch(/warn/);
            expect(message).toMatch(/warning_message/);
            message = null;
        });
    });

    describe("info", () => {
        it("should log a message", () => {
            logger.info("info_message");

            expect(message).toMatch(/info/);
            expect(message).toMatch(/info_message/);
            message = null;
        });
    });

    describe("debug", () => {
        it("should log a message", () => {
            logger.debug("debug_message");

            expect(message).toMatch(/debug/);
            expect(message).toMatch(/debug_message/);
            message = null;
        });
    });

    describe("verbose", () => {
        it("should log a message", () => {
            logger.verbose("verbose_message");

            expect(message).toMatch(/verbose/);
            expect(message).toMatch(/verbose_message/);
            message = null;
        });
    });

    describe("suppressConsoleOutput", () => {
        it("should suppress console output", () => {
            logger.suppressConsoleOutput(true);

            logger.info("silent_message");
            expect(message).toBeNull();

            logger.suppressConsoleOutput(false);

            logger.info("non_silent_message");
            expect(message).toMatch(/non_silent_message/);

            message = null;
        });
    });
});
