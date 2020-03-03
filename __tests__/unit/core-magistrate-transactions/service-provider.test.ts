import "jest-extended";
import { ServiceProvider } from "@arkecosystem/core-magistrate-transactions/src";
import { Application, Container } from "@arkecosystem/core-kernel";


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

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    })
});
