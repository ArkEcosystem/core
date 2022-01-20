import "jest-extended";

import { Application, Container, Providers, Services } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-logger-pino/src";
import { defaults } from "@packages/core-logger-pino/src/defaults";
import { AnySchema } from "joi";
import { dirSync } from "tmp";
import { Identifiers, interfaces } from "@arkecosystem/core-kernel/dist/ioc";
import { LogManager } from "@arkecosystem/core-kernel/dist/services/log";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.ConfigFlags).toConstantValue("core");
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
        app.bind<Services.Log.LogManager>(Container.Identifiers.LogManager)
            .to(Services.Log.LogManager)
            .inSingletonScope();

        await app.get<Services.Log.LogManager>(Container.Identifiers.LogManager).boot();

        serviceProvider.setConfig(app.resolve(Providers.PluginConfiguration).merge(defaults));

        app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("token-network");
        app.bind("path.log").toConstantValue(dirSync().name);

        app.bind(Identifiers.LogService).toDynamicValue((context: interfaces.Context) =>
            context.container.get<LogManager>(Identifiers.LogManager).driver(),
        );

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    describe("ServiceProvider.configSchema", () => {
        let serviceProvider: ServiceProvider;

        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_LOG_LEVEL")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-logger-pino/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.levels.console).toBeString();
            expect(result.value.levels.file).toBeString();

            expect(result.value.fileRotator.interval).toBeString();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-logger-pino/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_LOG_LEVEL", () => {
            it("should return value of process.env.CORE_LOG_LEVEL if defined", async () => {
                process.env.CORE_LOG_LEVEL = "dummy";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-logger-pino/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.levels.console).toEqual("dummy");
            });
        });

        describe("process.env.CORE_LOG_LEVEL_FILE", () => {
            it("should return value of process.env.CORE_LOG_LEVEL_FILE if defined", async () => {
                process.env.CORE_LOG_LEVEL_FILE = "dummy";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-logger-pino/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.levels.file).toEqual("dummy");
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-logger-pino/src/defaults")).defaults;
            });

            it("levels is required && is object", async () => {
                defaults.levels = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels" must be of type object');

                delete defaults.levels;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels" is required');
            });

            it("levels.console is required && is string", async () => {
                defaults.levels.console = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels.console" must be a string');

                delete defaults.levels.console;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels.console" is required');
            });

            it("levels.file is required && is string", async () => {
                defaults.levels.file = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels.file" must be a string');

                delete defaults.levels.file;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"levels.file" is required');
            });

            it("fileRotator is required && is object", async () => {
                defaults.fileRotator = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"fileRotator" must be of type object');

                delete defaults.fileRotator;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"fileRotator" is required');
            });

            it("fileRotator.interval is required && is string", async () => {
                defaults.fileRotator.interval = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"fileRotator.interval" must be a string');

                delete defaults.fileRotator.interval;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"fileRotator.interval" is required');
            });
        });
    });
});
