import "jest-extended";

import { Container } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots/src";
import { Sandbox } from "@packages/core-test-framework";
import * as typeorm from "typeorm";

let sandbox: Sandbox;

const spyOnGetCustomRepository = jest.spyOn(typeorm, "getCustomRepository").mockReturnValue(undefined);
const spyOnCreateConnection = jest.spyOn(typeorm, "createConnection").mockResolvedValue({
    close: jest.fn(),
} as any);

ServiceProvider.prototype.config = jest.fn().mockReturnValue({
    all: jest.fn().mockReturnValue({
        connection: {},
    }),
});

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue({});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = sandbox.app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalledTimes(3);
        expect(spyOnCreateConnection).toHaveBeenCalled();
    });

    it("should register is default connection is already active", async () => {
        sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue({});

        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalledTimes(3);
        expect(spyOnCreateConnection).toHaveBeenCalled();
    });

    it("should dispose", async () => {
        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalled();
        expect(spyOnCreateConnection).toHaveBeenCalled();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });
});
