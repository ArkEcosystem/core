import { AbstractLogger } from "@arkecosystem/core-logger";
import * as capcon from "capture-console";
import "jest-extended";
import { WinstonLogger } from "../src";

let logger: AbstractLogger;
let message;

beforeAll(() => {
    const driver = new WinstonLogger({
        transports: [
            {
                constructor: "Console",
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
            logger.info("error_message");

            expect(message).toMatch(/error/);
            expect(message).toMatch(/error_message/);
            message = null;
        });
    });

    describe("warn", () => {
        it("should log a message", () => {
            logger.info("warning_message");

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
            logger.info("debug_message");

            expect(message).toMatch(/debug/);
            expect(message).toMatch(/debug_message/);
            message = null;
        });
    });

    describe("printTracker", () => {
        it("should print the tracker", () => {
            logger.printTracker("test_title", 50, 100, "done");

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

            expect(message).toMatch(/test_title/);
            expect(message).toMatch(/=========================/);
            expect(message).toMatch(/50/);
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
