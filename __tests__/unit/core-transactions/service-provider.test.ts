import "jest-extended";

import { Application, Container } from "@packages/core-kernel/src";
import { ServiceProvider } from "@packages/core-transactions/src/service-provider";
import { AnySchema } from "joi";

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

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_TRANSACTION")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-transactions/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.memoizerCacheSize).toBeNumber();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-transactions/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_TRANSACTIONS_MEMOIZER_CACHE_SIZE", () => {
            it("should parse process.env.CORE_TRANSACTIONS_MEMOIZER_CACHE_SIZE", async () => {
                process.env.CORE_TRANSACTIONS_MEMOIZER_CACHE_SIZE = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transactions/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.memoizerCacheSize).toEqual(4000);
            });

            it("should throw if process.env.CORE_TRANSACTIONS_MEMOIZER_CACHE_SIZE is not number", async () => {
                process.env.CORE_TRANSACTIONS_MEMOIZER_CACHE_SIZE = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transactions/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"memoizerCacheSize" must be a number');
            });
        });
    });
});
