import "jest-extended";

import { LogServiceWrapper } from "@arkecosystem/core-manager/src/log-service-wrapper";

let logServiceWrapper: LogServiceWrapper;

let mockDatabase;
let mockLogger;

beforeEach(() => {
    mockDatabase = {
        addEvent: jest.fn(),
    };

    mockLogger = {
        make: jest.fn(),
        emergency: jest.fn(),
        alert: jest.fn(),
        critical: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
        notice: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        suppressConsoleOutput: jest.fn(),
    };

    logServiceWrapper = new LogServiceWrapper(mockLogger, mockDatabase);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Listener", () => {
    it("should call make", async () => {
        await expect(logServiceWrapper.make()).toResolve();

        expect(mockLogger.make).toHaveBeenCalledTimes(1);
    });

    it("should call emergency", async () => {
        logServiceWrapper.emergency("message");

        expect(mockLogger.emergency).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call alert", async () => {
        logServiceWrapper.alert("message");

        expect(mockLogger.alert).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call critical", async () => {
        logServiceWrapper.critical("message");

        expect(mockLogger.critical).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call error", async () => {
        logServiceWrapper.error("message");

        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call warning", async () => {
        logServiceWrapper.warning("message");

        expect(mockLogger.warning).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call notice", async () => {
        logServiceWrapper.notice("message");

        expect(mockLogger.notice).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call info", async () => {
        logServiceWrapper.info("message");

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call debug", async () => {
        logServiceWrapper.debug("message");

        expect(mockLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
    });

    it("should call suppressConsoleOutput", async () => {
        logServiceWrapper.suppressConsoleOutput(true);

        expect(mockLogger.suppressConsoleOutput).toHaveBeenCalledTimes(1);
    });
});
