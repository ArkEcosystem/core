import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import { AnySchema } from "joi";
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

    app.bind(Container.Identifiers.PeerRepository).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue({});

    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});

    defaults.server.http.enabled = true;
    defaults.server.https.enabled = true;
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
        defaults.server.https.enabled = false;

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
        defaults.server.https.enabled = false;

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

            expect(result.value.plugins.log.enabled).toBeFalse();

            expect(result.value.plugins.cache.enabled).toBeFalse();
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

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-api/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_API_DISABLED", () => {
            it("should return true when process.env.CORE_API_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_API_DISABLED is present", async () => {
                process.env.CORE_API_DISABLED = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeFalse();
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
            it("should return true if process.env.CORE_API_SSL is defined", async () => {
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

            it("should return false if process.env.CORE_API_SSL is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toEqual(false);
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

        describe("process.env.CORE_API_LOG", () => {
            it("should return false if process.env.CORE_API_LOG is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.log.enabled).toEqual(false);
            });

            it("should return true if process.env.CORE_API_LOG is defined", async () => {
                process.env.CORE_API_LOG = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.log.enabled).toEqual(true);
            });
        });

        describe("process.env.CORE_API_CACHE", () => {
            it("should return false if process.env.CORE_API_CACHE is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.cache.enabled).toEqual(false);
            });

            it("should return true if process.env.CORE_API_CACHE is defined", async () => {
                process.env.CORE_API_CACHE = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.cache.enabled).toEqual(true);
            });
        });

        describe("process.env.CORE_API_RATE_LIMIT_DISABLED", () => {
            it("should return true if process.env.CORE_API_RATE_LIMIT_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.enabled).toEqual(true);
            });

            it("should return false if process.env.CORE_API_RATE_LIMIT_ENABLED is defined", async () => {
                process.env.CORE_API_RATE_LIMIT_DISABLED = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.rateLimit.enabled).toEqual(false);
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
            it("should return false if process.env.CORE_API_TRUST_PROXY is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.trustProxy).toEqual(false);
            });

            it("should return false if process.env.CORE_API_TRUST_PROXY is defined", async () => {
                process.env.CORE_API_TRUST_PROXY = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.plugins.trustProxy).toEqual(true);
            });
        });

        describe("process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT", () => {
            it("should return true if process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT is undefined", async () => {
                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.options.estimateTotalCount).toEqual(true);
            });

            it("should return false if process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT is defined", async () => {
                process.env.CORE_API_NO_ESTIMATED_TOTAL_COUNT = "true";

                jest.resetModules();
                const result = (coreApiServiceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-api/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.options.estimateTotalCount).toEqual(false);
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-api/src/defaults")).defaults;
            });

            it("server is required && is object", async () => {
                defaults.server = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" must be of type object');

                delete defaults.server;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" is required');
            });

            it("server.http is required && is object", async () => {
                defaults.server.http = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" must be of type object');

                delete defaults.server.http;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" is required');
            });

            it("server.http.enabled is required && is boolean", async () => {
                defaults.server.http.enabled = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.enabled" must be a boolean');

                delete defaults.server.http.enabled;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.enabled" is required');
            });

            it("server.http.host is required && is string", async () => {
                defaults.server.http.host = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" must be a string');

                delete defaults.server.http.host;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" is required');
            });

            it("server.http.port is required && is integer && is >= 1 and <= 65535", async () => {
                defaults.server.http.port = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be a number');

                defaults.server.http.port = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be an integer');

                defaults.server.http.port = 0;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be greater than or equal to 1');

                defaults.server.http.port = 65536;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be less than or equal to 65535');

                delete defaults.server.http.port;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" is required');
            });

            it("server.https is required && is object", async () => {
                defaults.server.https = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https" must be of type object');

                delete defaults.server.https;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https" is required');
            });

            it("server.https.enabled is required && is boolean", async () => {
                defaults.server.https.enabled = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.enabled" must be a boolean');

                delete defaults.server.https.enabled;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.enabled" is required');
            });

            it("server.https.host is required && is string", async () => {
                defaults.server.https.host = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.host" must be a string');

                delete defaults.server.https.host;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.host" is required');
            });

            it("server.https.port is required && is integer && is >= 1 and <= 65535", async () => {
                defaults.server.https.port = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" must be a number');

                defaults.server.https.port = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" must be an integer');

                defaults.server.https.port = 0;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" must be greater than or equal to 1');

                defaults.server.https.port = 65536;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" must be less than or equal to 65535');

                delete defaults.server.https.port;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" is required');
            });

            it("server.https.tls is required && is object", async () => {
                defaults.server.https.tls = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls" must be of type object');

                delete defaults.server.https.tls;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls" is required');
            });

            it("server.https.tls.key is required when server.https.enabled && is string", async () => {
                delete defaults.server.https.tls.key;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.server.https.enabled = true;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.key" is required');

                defaults.server.https.tls.key = false;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.key" must be a string');
            });

            it("server.https.tls.cert is required when server.https.enabled && is string", async () => {
                delete defaults.server.https.tls.cert;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.server.https.enabled = true;
                defaults.server.https.tls.key = "path/to/key";
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.cert" is required');

                defaults.server.https.tls.cert = false;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.cert" must be a string');
            });

            it("plugins is required && is object", async () => {
                defaults.plugins = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins" must be of type object');

                delete defaults.plugins;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins" is required');
            });

            it("plugins.cache is required && is object", async () => {
                defaults.plugins.cache = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache" must be of type object');

                delete defaults.plugins.cache;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache" is required');
            });

            it("plugins.cache.enabled is required && is boolean", async () => {
                defaults.plugins.cache.enabled = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.enabled" must be a boolean');

                delete defaults.plugins.cache.enabled;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.enabled" is required');
            });

            it("plugins.cache.stdTTL is required && is integer && >= 0", async () => {
                defaults.plugins.cache.stdTTL = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.stdTTL" must be a number');

                defaults.plugins.cache.stdTTL = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.stdTTL" must be an integer');

                defaults.plugins.cache.stdTTL = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.stdTTL" must be greater than or equal to 0');

                delete defaults.plugins.cache.stdTTL;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.stdTTL" is required');
            });

            it("plugins.cache.checkperiod is required && is integer && >= 0", async () => {
                defaults.plugins.cache.checkperiod = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.checkperiod" must be a number');

                defaults.plugins.cache.checkperiod = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.checkperiod" must be an integer');

                defaults.plugins.cache.checkperiod = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.checkperiod" must be greater than or equal to 0');

                delete defaults.plugins.cache.checkperiod;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.cache.checkperiod" is required');
            });

            it("plugins.rateLimit is required && is object", async () => {
                defaults.plugins.rateLimit = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit" must be of type object');

                delete defaults.plugins.rateLimit;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit" is required');
            });

            it("plugins.rateLimit.enabled is required && is boolean", async () => {
                defaults.plugins.rateLimit.enabled = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.enabled" must be a boolean');

                delete defaults.plugins.rateLimit.enabled;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.enabled" is required');
            });

            it("plugins.rateLimit.points is required && is integer && >= 0", async () => {
                defaults.plugins.rateLimit.points = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.points" must be a number');

                defaults.plugins.rateLimit.points = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.points" must be an integer');

                defaults.plugins.rateLimit.points = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.points" must be greater than or equal to 0');

                delete defaults.plugins.rateLimit.points;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.points" is required');
            });

            it("plugins.rateLimit.duration is required && is integer && >= 0", async () => {
                defaults.plugins.rateLimit.duration = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.duration" must be a number');

                defaults.plugins.rateLimit.duration = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.duration" must be an integer');

                defaults.plugins.rateLimit.duration = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"plugins.rateLimit.duration" must be greater than or equal to 0',
                );

                delete defaults.plugins.rateLimit.duration;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.duration" is required');
            });

            it("plugins.rateLimit.whitelist is required && is array && must contain strings", async () => {
                defaults.plugins.rateLimit.whitelist = {};
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.whitelist" must be an array');

                defaults.plugins.rateLimit.whitelist = [false];
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.whitelist[0]" must be a string');

                delete defaults.plugins.rateLimit.whitelist;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.whitelist" is required');
            });

            it("plugins.rateLimit.blacklist is required && is array && must contain strings", async () => {
                defaults.plugins.rateLimit.blacklist = {};
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.blacklist" must be an array');

                defaults.plugins.rateLimit.blacklist = [false];
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.blacklist[0]" must be a string');

                delete defaults.plugins.rateLimit.blacklist;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.rateLimit.blacklist" is required');
            });

            it("plugins.pagination is required && is object", async () => {
                defaults.plugins.pagination = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination" must be of type object');

                delete defaults.plugins.pagination;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination" is required');
            });

            it("plugins.pagination.limit is required && is integer && >= 0", async () => {
                defaults.plugins.pagination.limit = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination.limit" must be a number');

                defaults.plugins.pagination.limit = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination.limit" must be an integer');

                defaults.plugins.pagination.limit = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination.limit" must be greater than or equal to 0');

                delete defaults.plugins.pagination.limit;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.pagination.limit" is required');
            });

            it("plugins.socketTimeout is required && is integer && >= 0", async () => {
                defaults.plugins.socketTimeout = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.socketTimeout" must be a number');

                defaults.plugins.socketTimeout = 1.12;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.socketTimeout" must be an integer');

                defaults.plugins.socketTimeout = -1;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.socketTimeout" must be greater than or equal to 0');

                delete defaults.plugins.socketTimeout;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.socketTimeout" is required');
            });

            it("plugins.whitelist is required && is array && must contain strings", async () => {
                defaults.plugins.whitelist = {};
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.whitelist" must be an array');

                defaults.plugins.whitelist = [false];
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.whitelist[0]" must be a string');

                delete defaults.plugins.whitelist;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.whitelist" is required');
            });

            it("plugins.trustProxy is required && is boolean", async () => {
                defaults.plugins.trustProxy = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.trustProxy" must be a boolean');

                delete defaults.plugins.trustProxy;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.trustProxy" is required');
            });

            it("options is required && is object", async () => {
                defaults.options = false;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"options" must be of type object');

                delete defaults.options;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"options" is required');
            });

            it("options.estimateTotalCount is required && is boolean", async () => {
                defaults.options.estimateTotalCount = 123;
                let result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"options.estimateTotalCount" must be a boolean');

                delete defaults.options.estimateTotalCount;
                result = (coreApiServiceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"options.estimateTotalCount" is required');
            });
        });
    });
});
