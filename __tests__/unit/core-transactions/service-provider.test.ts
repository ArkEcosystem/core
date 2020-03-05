import "jest-extended";

import { Application, Container } from "@packages/core-kernel/src";
import { ServiceProvider } from "@packages/core-transactions/src/service-provider";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
    });

    it("should be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });
});
