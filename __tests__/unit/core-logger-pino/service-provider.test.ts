import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { ConsoleLogger } from "@packages/core-kernel/src/services/log/drivers/console";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { ServiceProvider as LogServiceProvider } from "@packages/core-kernel/src/services/log";
import { ServiceProvider as PinoServiceProvider } from "@packages/core-logger-pino/src/service-provider";
import { PinoLogger } from "@packages/core-logger-pino/src/driver";
import { defaults } from "@packages/core-logger-pino/src/defaults";
import { dirSync, setGracefulCleanup } from "tmp";

// FIX: Types have separate declarations of a private property 'configRepository'.
//      This error shows up if we try to resolve "PluginConfiguration" from the "core-kernel/src" directory.
import { PluginConfiguration } from "../../../node_modules/@arkecosystem/core-kernel/dist/providers/plugin-configuration";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository).toConstantValue(new ConfigRepository({}));
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-jestnet");
    app.bind("path.log").toConstantValue(dirSync().name);
});

afterEach(() => container.restore());

afterAll(() => setGracefulCleanup());

describe("PinoServiceProvider", () => {
    it(".register", async () => {
        await app.resolve<LogServiceProvider>(LogServiceProvider).register();

        expect(app.get(Identifiers.LogService)).toBeInstanceOf(ConsoleLogger);

        const serviceProvider = await app.resolve(PinoServiceProvider);
        serviceProvider.setConfig(app.resolve(PluginConfiguration).merge(defaults));

        await serviceProvider.register();

        expect(app.get(Identifiers.LogService)).toBeInstanceOf(PinoLogger);
    });

    it(".required", async () => {
        await app.resolve<LogServiceProvider>(LogServiceProvider).register();

        const serviceProvider = await app.resolve(PinoServiceProvider);
        serviceProvider.setConfig(app.resolve(PluginConfiguration).merge(defaults));

        expect(serviceProvider.required()).resolves.toBeTrue();
    });
});
