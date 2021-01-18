import "jest-extended";

import { AnySchema } from "@hapi/joi";
import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import path from "path";

let app: Application;

const logger = {
    notice: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    app.bind(Container.Identifiers.StateStore).toConstantValue({});

    app.bind(Container.Identifiers.BlockchainService).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});

    app.bind(Container.Identifiers.WalletRepository).toConstantValue({});

    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});

    app.bind(Container.Identifiers.PeerStorage).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});

    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});

    defaults.server.http.enabled = true;
    defaults.server.https.enabled = "enabled";
    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
});

describe("ServiceProvider", () => {
    it("should register", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
    });

    it("should boot", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();
    });

    it("should boot if HTTP and HTTPS server are disabled", async () => {
        defaults.server.http.enabled = false;
        defaults.server.https.enabled = undefined;

        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeFalse();

        await expect(coreApiServiceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeTrue();

        await expect(coreApiServiceProvider.boot()).toResolve();

        await expect(coreApiServiceProvider.dispose()).toResolve();
    });

    it("should dispose if HTTP and HTTPS server are disabled", async () => {
        defaults.server.http.enabled = false;
        defaults.server.https.enabled = undefined;

        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound<Server>(Identifiers.HTTPS)).toBeFalse();

        await expect(coreApiServiceProvider.boot()).toResolve();

        await expect(coreApiServiceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        await expect(coreApiServiceProvider.required()).resolves.toBeFalse();
    });

    describe("configSchema", () => {
        let coreApiServiceProvider: CoreApiServiceProvider;

        beforeEach(() => {
            coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

            process.env.CORE_API_ENABLED = "true";

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_API_")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-api/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.server.http.enabled).toBeTrue();
            expect(result.value.server.http.host).toEqual("0.0.0.0");
            expect(result.value.server.http.port).toEqual(4003);

            expect(result.value.server.https.enabled).toBeFalse();
            expect(result.value.server.https.host).toEqual("0.0.0.0");
            expect(result.value.server.https.port).toEqual(8443);
            expect(result.value.server.https.tls.key).toBeUndefined();
            expect(result.value.server.https.tls.cert).toBeUndefined();

            expect(result.value.plugins.cache.enabled).toBeTrue();
            expect(result.value.plugins.cache.stdTTL).toBeNumber();
            expect(result.value.plugins.cache.checkperiod).toBeNumber();

            expect(result.value.plugins.rateLimit.enabled).toBeTrue();
            expect(result.value.plugins.rateLimit.points).toBeNumber();
            expect(result.value.plugins.rateLimit.duration).toBeNumber();
            expect(result.value.plugins.rateLimit.whitelist).toEqual([]);
            expect(result.value.plugins.rateLimit.blacklist).toEqual([]);

            expect(result.value.plugins.pagination.limit).toBeNumber();
            expect(result.value.plugins.socketTimeout).toBeNumber();
            expect(result.value.plugins.whitelist).toEqual(["*"]);
            expect(result.value.plugins.trustProxy).toBeFalse();

            expect(result.value.options.estimateTotalCount).toBeTrue();
        });

        describe("process.env.CORE_API_ENABLED", () => {
            it("should return true when process.env.CORE_API_ENABLED = true", async () => {
                process.env.CORE_API_ENABLED = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_API_ENABLED = false", async () => {
                process.env.CORE_API_ENABLED = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeFalse();
            });

            it("should throw when process.env.CORE_API_ENABLED is invalid", async () => {
                process.env.CORE_API_ENABLED = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.http.enabled" must be a boolean');
            });
        });

        describe("process.env.CORE_API_HOST", () => {
            it("should parse process.env.CORE_API_HOST", async () => {
                process.env.CORE_API_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_API_PORT", () => {
            it("should parse process.env.CORE_API_PORT", async () => {
                process.env.CORE_API_PORT = "4000";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.port).toEqual(4000);
            });

            it("should throw if process.env.CORE_API_PORT is not number", async () => {
                process.env.CORE_API_PORT = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.http.port" must be a number');
            });
        });

        describe("process.env.CORE_API_SSL", () => {
            it("should return true if process.env.CORE_API_SSL = true", async () => {
                process.env.CORE_API_SSL = "true";
                process.env.CORE_API_SSL_KEY = "path/to/key";
                process.env.CORE_API_SSL_CERT = "path/to/cert";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toEqual(true);
            });

            it("should return false if process.env.CORE_API_SSL = false", async () => {
                process.env.CORE_API_SSL = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toEqual(false);
            });

            it("should throw error if process.env.CORE_API_SSL is invalid", async () => {
                process.env.CORE_API_SSL = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.enabled" must be a boolean');
            });

            it("should throw error if process.env.CORE_API_SSL = true and CORE_API_SSL_KEY or CORE_API_SSL_CERT is undefined", async () => {
                process.env.CORE_API_SSL = "true";
                process.env.CORE_API_SSL_KEY = "path/to/key";

                jest.resetModules();
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.cert" is required');

                delete process.env.CORE_API_SSL_KEY;
                process.env.CORE_API_SSL_CERT = "path/to/cert";

                jest.resetModules();
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.key" is required');
            });
        });

        describe("process.env.CORE_API_CACHE", () => {
            it("should return true if process.env.CORE_API_CACHE = true", async () => {
                process.env.CORE_API_CACHE = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.cache.enabled).toEqual(true);
            });

            it("should return false if process.env.CORE_API_CACHE = false", async () => {
                process.env.CORE_API_CACHE = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.cache.enabled).toEqual(false);
            });

            it("should throw error if process.env.CORE_API_CACHE is invalid", async () => {
                process.env.CORE_API_CACHE = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"plugins.cache.enabled" must be a boolean');
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_ENABLED", () => {
            it("should return true if process.env.CORE_API_RATE_LIMIT_ENABLED = true", async () => {
                process.env.CORE_API_RATE_LIMIT_ENABLED = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.enabled).toEqual(true);
            });

            it("should return false if process.env.CORE_API_RATE_LIMIT_ENABLED = false", async () => {
                process.env.CORE_API_RATE_LIMIT_ENABLED = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.enabled).toEqual(false);
            });

            it("should throw error if process.env.CORE_API_RATE_LIMIT_ENABLED is invalid", async () => {
                process.env.CORE_API_RATE_LIMIT_ENABLED = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"plugins.rateLimit.enabled" must be a boolean');
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_USER_LIMIT", () => {
            it("should parse process.env.CORE_API_RATE_LIMIT_USER_LIMIT", async () => {
                process.env.CORE_API_RATE_LIMIT_USER_LIMIT = "200";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.points).toEqual(200);
            });

            it("should throw if process.env.CORE_API_RATE_LIMIT_USER_LIMIT is invalid", async () => {
                process.env.CORE_API_RATE_LIMIT_USER_LIMIT = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"plugins.rateLimit.points" must be a number');
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_USER_EXPIRES", () => {
            it("should parse process.env.CORE_API_RATE_LIMIT_USER_EXPIRES", async () => {
                process.env.CORE_API_RATE_LIMIT_USER_EXPIRES = "200";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.duration).toEqual(200);
            });

            it("should throw if process.env.CORE_API_RATE_LIMIT_USER_EXPIRES is invalid", async () => {
                process.env.CORE_API_RATE_LIMIT_USER_EXPIRES = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"plugins.rateLimit.duration" must be a number');
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_WHITELIST", () => {
            it("should parse process.env.CORE_API_RATE_LIMIT_WHITELIST", async () => {
                process.env.CORE_API_RATE_LIMIT_WHITELIST = "*,127.0.0.1,127.0.*";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.whitelist).toEqual(["*", "127.0.0.1", "127.0.*"]);
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_BLACKLIST", () => {
            it("should parse process.env.CORE_API_RATE_LIMIT_BLACKLIST", async () => {
                process.env.CORE_API_RATE_LIMIT_BLACKLIST = "*,127.0.0.1,127.0.*";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.blacklist).toEqual(["*", "127.0.0.1", "127.0.*"]);
            });
        });

        describe("process.env.CORE_API_TRUST_PROXY", () => {
            it("should return true if process.env.CORE_API_TRUST_PROXY = true", async () => {
                process.env.CORE_API_TRUST_PROXY = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.trustProxy).toEqual(true);
            });

            it("should return false if process.env.CORE_API_TRUST_PROXY = false", async () => {
                process.env.CORE_API_TRUST_PROXY = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.trustProxy).toEqual(false);
            });

            it("should return error if process.env.CORE_API_TRUST_PROXY is invalid", async () => {
                process.env.CORE_API_TRUST_PROXY = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"plugins.trustProxy" must be a boolean');
            });
        });

        describe("process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT", () => {
            it("should return true if process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = true", async () => {
                process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.options.estimateTotalCount).toEqual(true);
            });

            it("should return false if process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = false", async () => {
                process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = "false";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.options.estimateTotalCount).toEqual(false);
            });

            it("should return error if process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT is invalid", async () => {
                process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = "invalid";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"options.estimateTotalCount" must be a boolean');
            });
        });
    });
});
