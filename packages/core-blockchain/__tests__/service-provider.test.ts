import "jest-extended";

import { ServiceProvider } from "@packages/core-blockchain/src/service-provider";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Services } from "@packages/core-kernel/dist";
import { AnySchema } from "joi";

describe("ServiceProvider", () => {
    let app: Application;
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        app = new Application(new Container.Container());

        app.bind(Container.Identifiers.StateStore).toConstantValue({ reset: jest.fn() });
        app.bind(Container.Identifiers.DatabaseService).toConstantValue({});
        app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue({});
        app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
        app.bind(Container.Identifiers.TransactionPoolService).toConstantValue({});
        app.bind(Container.Identifiers.LogService).toConstantValue({});
        app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});
        app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
        app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    describe("register", () => {
        it("should bind blockchain, state machine and block processr", async () => {
            const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
            serviceProvider.setConfig(pluginConfiguration);

            expect(app.isBound(Container.Identifiers.StateMachine)).toBeFalse();
            expect(app.isBound(Container.Identifiers.BlockchainService)).toBeFalse();
            expect(app.isBound(Container.Identifiers.BlockProcessor)).toBeFalse();

            await serviceProvider.register();

            expect(app.isBound(Container.Identifiers.StateMachine)).toBeTrue();
            expect(app.isBound(Container.Identifiers.BlockchainService)).toBeTrue();
            expect(app.isBound(Container.Identifiers.BlockProcessor)).toBeTrue();
        });
    });

    describe("boot", () => {
        it("should call boot on blockchain service", async () => {
            const blockchainService = { boot: jest.fn() };
            app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchainService);

            await serviceProvider.boot();

            expect(blockchainService.boot).toBeCalledTimes(1);
        });
    });

    describe("dispose", () => {
        it("should call dispose on blockchain service", async () => {
            const blockchainService = { dispose: jest.fn() };
            app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchainService);

            await serviceProvider.dispose();

            expect(blockchainService.dispose).toBeCalledTimes(1);
        });
    });

    describe("required", () => {
        it("should return true", async () => {
            const required = await serviceProvider.required();

            expect(required).toBeTrue();
        });
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-blockchain/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.databaseRollback.maxBlockRewind).toBeNumber();
            expect(result.value.databaseRollback.steps).toBeNumber();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-blockchain/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-blockchain/src/defaults")).defaults;
            });

            it("databaseRollback is required", async () => {
                delete defaults.databaseRollback;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback" is required');
            });

            it("databaseRollback.maxBlockRewind is required && is integer && >= 1", async () => {
                defaults.databaseRollback.maxBlockRewind = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.maxBlockRewind" must be a number');

                defaults.databaseRollback.maxBlockRewind = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.maxBlockRewind" must be an integer');

                defaults.databaseRollback.maxBlockRewind = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"databaseRollback.maxBlockRewind" must be greater than or equal to 1',
                );

                delete defaults.databaseRollback.maxBlockRewind;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.maxBlockRewind" is required');
            });

            it("databaseRollback.steps is required && is integer && >= 1", async () => {
                defaults.databaseRollback.steps = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.steps" must be a number');

                defaults.databaseRollback.steps = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.steps" must be an integer');

                defaults.databaseRollback.steps = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.steps" must be greater than or equal to 1');

                delete defaults.databaseRollback.steps;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"databaseRollback.steps" is required');
            });

            it("networkStart is optional && is boolean", async () => {
                defaults.networkStart = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"networkStart" must be a boolean');

                delete defaults.networkStart;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });
        });
    });
});
