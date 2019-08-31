import "jest-extended";

import capcon from "capture-console";

// import { tmpdir } from "os";
import { Logger } from "../../../packages/core-kernel/src/services/log/logger";

export function expectLogger(callback): void {
    let logger: Logger;
    let message: string;

    beforeAll(async () => {
        // process.env.CORE_PATH_LOG = tmpdir();

        logger = await callback().make();

        capcon.startCapture(process.stdout, stdout => {
            message = stdout.toString();
        });

        capcon.startCapture(process.stderr, stderr => {
            message = stderr.toString();
        });

        // @ts-ignore
        capcon.startCapture(console._stdout, stdout => {
            message = stdout.toString();
        });

        // @ts-ignore
        capcon.startCapture(console._stderr, stderr => {
            message = stderr.toString();
        });
    });

    afterEach(() => (message = undefined));

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
    });
}
