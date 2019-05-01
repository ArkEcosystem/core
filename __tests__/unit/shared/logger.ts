import { Logger } from "@arkecosystem/core-interfaces";
import * as capcon from "capture-console";
import "jest-extended";
import { tmpdir } from "os";

export function expectLogger(callback): void {
    let logger: Logger.ILogger;
    let message: string;

    beforeAll(() => {
        process.env.CORE_PATH_LOG = tmpdir();

        logger = callback().make();

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
        it("should log a message with the [error] level", () => {
            logger.error("error_message");

            expect(message).toMatch(/error/);
            expect(message).toMatch(/error_message/);
        });

        it("should log a message with the [warn] level", () => {
            logger.warn("warning_message");

            expect(message).toMatch(/warn/);
            expect(message).toMatch(/warning_message/);
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

        it("should log a message with the [verbose] level", () => {
            logger.verbose("verbose_message");

            expect(message).toMatch(/verbose/);
            expect(message).toMatch(/verbose_message/);
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
