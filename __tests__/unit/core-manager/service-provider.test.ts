import "jest-extended";

import { Application, Container } from "@packages/core-kernel/src";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";

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

    it("should dispose", async () => {
        await expect(serviceProvider.register()).toResolve();
        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });
});
