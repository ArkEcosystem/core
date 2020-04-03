import "jest-extended";
import * as typeorm from "typeorm";
import { Container } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots/src";
import { Sandbox } from "@arkecosystem/core-test-framework";

let sandbox: Sandbox;

let spyOnGetCustomRepository = jest.spyOn(typeorm, "getCustomRepository").mockReturnValue(undefined);

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue({});

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue({});
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = sandbox.app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalledTimes(3);
    });

    // TODO: Check later
    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });
});
