import "jest-extended";

import { Providers } from "@arkecosystem/core-kernel";
import { Application, Container, Services } from "@packages/core-kernel/src";
import { ServiceProvider } from "@packages/core-logger-pino/src";
import { defaults } from "@packages/core-logger-pino/src/defaults";
import { dirSync } from "tmp";

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
        app.bind<Services.Log.LogManager>(Container.Identifiers.LogManager)
            .to(Services.Log.LogManager)
            .inSingletonScope();

        await app.get<Services.Log.LogManager>(Container.Identifiers.LogManager).boot();

        serviceProvider.setConfig(app.resolve(Providers.PluginConfiguration).merge(defaults));

        app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("token-network");
        app.bind("path.log").toConstantValue(dirSync().name);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should be disposable", async () => {
        await expect(serviceProvider.dispose()).toResolve();
    });
});
