import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { LoadEnvironmentVariables } from "@packages/core-kernel/src/bootstrap/app";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";

let app: Application;

const mockLogger = {
    alert: jest.fn(),
};

const mockDriver = {
    loadEnvironmentVariables: jest.fn(),
};

const mockConfigManager = {
    driver: jest.fn().mockReturnValue(mockDriver),
};

beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.LogService).toConstantValue(mockLogger);
    app.bind(Identifiers.ConfigManager).toConstantValue(mockConfigManager);
});

describe("LoadCryptography", () => {
    it("should bootstrap and load env variables", async () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("testnet");

        await app.resolve<LoadEnvironmentVariables>(LoadEnvironmentVariables).bootstrap();

        expect(mockLogger.alert).not.toBeCalled();
    });

    it("should bootstrap and alert if loadEnvironmentVariables throws error", async () => {
        mockDriver.loadEnvironmentVariables = jest.fn().mockImplementation(() => {
            throw new Error("Error loading .env variables.");
        });

        await app.resolve<LoadEnvironmentVariables>(LoadEnvironmentVariables).bootstrap();

        expect(mockLogger.alert).toBeCalled();
    });
});
