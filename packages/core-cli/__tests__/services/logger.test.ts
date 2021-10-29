import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Logger } from "@packages/core-cli/src/services";

let cli;
let logger;

beforeEach(() => {
    cli = new Console();

    logger = cli.app.resolve(Logger);
});

afterEach(() => jest.resetAllMocks());

describe("Logger", () => {
    it("should log an emergency message", () => {
        const spyConsole = jest.spyOn(console, "error");

        logger.emergency("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log an alert message", () => {
        const spyConsole = jest.spyOn(console, "error");

        logger.alert("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log a critical message", () => {
        const spyConsole = jest.spyOn(console, "error");

        logger.critical("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log an error message", () => {
        const spyConsole = jest.spyOn(console, "error");

        logger.error("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log a warning message", () => {
        const spyConsole = jest.spyOn(console, "warn");

        logger.warning("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log a notice message", () => {
        const spyConsole = jest.spyOn(console, "info");

        logger.notice("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log an info message", () => {
        const spyConsole = jest.spyOn(console, "info");

        logger.info("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log a debug message", () => {
        const spyConsole = jest.spyOn(console, "debug");

        logger.debug("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should log a message", () => {
        const spyConsole = jest.spyOn(console, "log");

        logger.log("this should be written to stdout");

        expect(spyConsole).toHaveBeenCalled();
    });

    it("should not log a message if the output is quiet", () => {
        cli.app.get(Container.Identifiers.Output).setVerbosity(0);

        const spyConsole = jest.spyOn(console, "log");

        logger.log("this should be written to stdout");

        expect(spyConsole).not.toHaveBeenCalled();
    });
});
