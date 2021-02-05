import "jest-extended";

import { Application, Container, Services } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-state/src";
import { AnySchema } from "joi";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
});

afterAll(() => jest.clearAllMocks());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    afterAll(() => jest.clearAllMocks());

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot correctly", async () => {
        const initializeSpy = jest.fn();
        jest.spyOn(app, "get").mockReturnValue({ initialize: initializeSpy, bind: jest.fn(), boot: jest.fn() });
        await serviceProvider.register();
        expect(async () => await serviceProvider.boot()).not.toThrow();
        expect(initializeSpy).toHaveBeenCalled();
    });

    it("should boot when the package is core-database", async () => {
        expect(await serviceProvider.bootWhen()).toEqual(false);
        expect(await serviceProvider.bootWhen("@arkecosystem/core-database")).toEqual(true);
    });

    describe("ServiceProvider.configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key === "CORE_WALLET_SYNC_ENABLED") {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-state/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.storage.maxLastBlocks).toBeNumber();
            expect(result.value.storage.maxLastTransactionIds).toBeNumber();

            expect(result.value.walletSync.enabled).toBeFalse();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-state/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_WALLET_SYNC_ENABLED", () => {
            it("should return value of process.env.CORE_WALLET_SYNC_ENABLED if defined", async () => {
                process.env.CORE_WALLET_SYNC_ENABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-state/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.walletSync.enabled).toBeTrue();
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-state/src/defaults")).defaults;
            });

            it("storage is required && is object", async () => {
                defaults.storage = true;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage" must be of type object');

                delete defaults.storage;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage" is required');
            });

            it("storage.maxLastBlocks is required && is integer && >= 1", async () => {
                defaults.storage.maxLastBlocks = true;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastBlocks" must be a number');

                defaults.storage.maxLastBlocks = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastBlocks" must be an integer');

                defaults.storage.maxLastBlocks = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastBlocks" must be greater than or equal to 1');

                delete defaults.storage.maxLastBlocks;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastBlocks" is required');
            });

            it("storage.maxLastTransactionIds is required && is integer && >= 1", async () => {
                defaults.storage.maxLastTransactionIds = true;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastTransactionIds" must be a number');

                defaults.storage.maxLastTransactionIds = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastTransactionIds" must be an integer');

                defaults.storage.maxLastTransactionIds = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"storage.maxLastTransactionIds" must be greater than or equal to 1',
                );

                delete defaults.storage.maxLastTransactionIds;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage.maxLastTransactionIds" is required');
            });

            it("walletSync is required && is object", async () => {
                defaults.walletSync = true;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"walletSync" must be of type object');

                delete defaults.walletSync;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"walletSync" is required');
            });

            it("walletSync.enabled is required && is boolean", async () => {
                defaults.walletSync.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"walletSync.enabled" must be a boolean');

                delete defaults.walletSync.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"walletSync.enabled" is required');
            });
        });
    });
});
