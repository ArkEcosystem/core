import "jest-extended";

import { Application, Container } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-state/src";
import { StateBuilder } from "@packages/core-state/src/state-builder";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
});

afterAll(() => jest.clearAllMocks());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
    });

    it("should call statebuilder on boot", async () => {
        const resolveSpy = jest.spyOn(app, "resolve");
        await serviceProvider.register();
        expect(async () => await serviceProvider.boot()).not.toThrow();
        expect(resolveSpy).toHaveBeenCalledWith(StateBuilder);
    });

    it("should boot when the package is core-database", async () => {
        expect(await serviceProvider.bootWhen()).toEqual(false);
        expect(await serviceProvider.bootWhen("@arkecosystem/core-database")).toEqual(true);
    });
});
