import "jest-extended";

import { Application, Container, Services } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-transaction-pool/src";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register, boot and dispose", async () => {
        await expect(serviceProvider.register()).toResolve();

        app.rebind(Container.Identifiers.TransactionPoolStorage).toConstantValue({
            boot: jest.fn(),
            dispose: jest.fn(),
        });
        app.rebind(Container.Identifiers.TransactionPoolService).toConstantValue({ boot: jest.fn() });

        await expect(serviceProvider.boot()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });
});
