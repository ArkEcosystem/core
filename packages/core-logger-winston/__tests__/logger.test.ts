import { AbstractLogger } from "@arkecosystem/core-logger";
import * as capcon from "capture-console";
import "jest-extended";
import * as winston from "winston";
import { WinstonLogger } from "../src";

let logger: AbstractLogger;
let message;

beforeAll(() => {
    const driver = new WinstonLogger({
        transports: [
            {
                constructor: "Console",
                package: "winston/lib/winston/transports/console",
                options: {
                    level: "debug",
                },
            },
            {
                constructor: "File",
                options: { filename: "tmp.log", level: "silly" },
            },
        ],
    });

    logger = driver.make();

    capcon.startCapture(process.stdout, stdout => {
        message += stdout;
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

    describe("printTracker", () => {
        it("should print the tracker", () => {
            logger.printTracker("test_title", 50, 100, "done");
            logger.printTracker("second_tracker", 0, 100, null);

            expect(message).toMatch(/test_title/);
            expect(message).toMatch(/=========================/);
            expect(message).toMatch(/50/);
            expect(message).toMatch(/done/);
            message = null;
        });
    });

    describe("stopTracker", () => {
        it("should stop the tracker", () => {
            logger.stopTracker("test_title", 50, 100);
            logger.stopTracker("second_tracker", 101, 100);

            expect(message).toMatch(/test_title/);
            expect(message).toMatch(/=========================/);
            expect(message).toMatch(/100/);
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
