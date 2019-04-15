import { Logger } from "./__stubs__/logger";

const dummyMessage = "Hello World";

const stubLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
};

let logger;
beforeEach(() => {
    logger = new Logger({ stubLogger }).make();
});

describe("Logger", () => {
    describe.each(Object.keys(stubLogger))(".%s(message)", level => {
        it("should log a message", () => {
            const spy = jest.spyOn(logger, "log");

            expect(logger[level](dummyMessage)).toBeTrue();
            expect(spy).toHaveBeenCalledWith(level, dummyMessage);
            expect(stubLogger[level]).toHaveBeenCalledWith(dummyMessage);

            spy.mockRestore();
        });

        it("should not log a message if suppressing console output", () => {
            const spy = jest.spyOn(logger, "log");

            logger.suppressConsoleOutput();

            expect(logger[level](dummyMessage)).toBeFalse();
            expect(spy).toHaveBeenCalledWith(level, dummyMessage);
            expect(stubLogger[level]).not.toHaveBeenCalledWith();

            spy.mockRestore();
        });

        it("should not log a message if it is empty", () => {
            expect(logger[level]("")).toBeFalse();
            expect(logger[level]({})).toBeFalse();
            expect(logger[level]([])).toBeFalse();
            expect(logger[level](null)).toBeFalse();
            expect(logger[level](undefined)).toBeFalse();
        });

        it("should modify and log a message if it is an object", () => {
            logger[level]({ hello: "world" });

            expect(stubLogger[level]).toHaveBeenCalledWith("{ hello: 'world' }");
        });

        it("should modify and log a message if it is an array", () => {
            logger[level](["hello"]);

            expect(stubLogger[level]).toHaveBeenCalledWith("[ 'hello' ]");
        });
    });
});
