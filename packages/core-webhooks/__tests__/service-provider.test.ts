import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import { NullEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/null";
import { ServiceProvider } from "@packages/core-webhooks/src";
import { defaults as webhooksDefaults } from "@packages/core-webhooks/src/defaults";
import { AnySchema } from "joi";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;

const logger = {
    error: jest.fn(),
    notice: jest.fn(),
    debug: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

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

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});

    app.bind(Container.Identifiers.EventDispatcherService).to(NullEventDispatcher);

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    app.bind("path.cache").toConstantValue(dirSync().name);
});

afterAll(() => setGracefulCleanup());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;
    let coreApiServiceProvider: CoreApiServiceProvider;

    beforeEach(async () => {
        coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();
    });

    it("should dispose", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should bootWhen be true when enabled", async () => {
        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);

        // @ts-ignore
        webhooksDefaults.enabled = true;
        const instance = pluginConfiguration.from("core-webhooks", webhooksDefaults);

        serviceProvider.setConfig(instance);

        await expect(serviceProvider.bootWhen()).resolves.toBeTrue();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });

    describe("ServiceProvider.configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_WEBHOOKS_")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-webhooks/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.enabled).toBeFalse();
            expect(result.value.server.http.host).toBeString();
            expect(result.value.server.http.port).toBeNumber();
            expect(result.value.server.http.port).toBeNumber();
            expect(result.value.server.whitelist).toBeArray();
            result.value.server.whitelist.forEach((item) => {
                expect(item).toBeString();
            });
            expect(result.value.timeout).toBeNumber();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-webhooks/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_WEBHOOKS_ENABLED", () => {
            it("should return true if process.env.CORE_WEBHOOKS_ENABLED is defined", async () => {
                process.env.CORE_WEBHOOKS_ENABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-webhooks/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.enabled).toEqual(true);
            });
        });

        describe("process.env.CORE_WEBHOOKS_HOST", () => {
            it("should return value of process.env.CORE_WEBHOOKS_HOST if defined", async () => {
                process.env.CORE_WEBHOOKS_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-webhooks/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_WEBHOOKS_TIMEOUT", () => {
            it("should return value of process.env.CORE_WEBHOOKS_TIMEOUT if defined", async () => {
                process.env.CORE_WEBHOOKS_TIMEOUT = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-webhooks/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.timeout).toEqual(5000);
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-webhooks/src/defaults")).defaults;
            });

            it("enabled is required && is boolean", async () => {
                defaults.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"enabled" must be a boolean');

                delete defaults.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"enabled" is required');
            });

            it("server is required && is object", async () => {
                defaults.server = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" must be of type object');

                delete defaults.server;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" is required');
            });

            it("server.http is required && is object", async () => {
                defaults.server.http = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" must be of type object');

                delete defaults.server.http;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" is required');
            });

            it("server.http.host is required && is IP address", async () => {
                defaults.server.http.host = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" must be a string');

                defaults.server.http.host = "dummy";
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"server.http.host" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );

                delete defaults.server.http.host;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" is required');
            });

            it("server.http.port is required && is integer && >= 1 && <= 65535", async () => {
                defaults.server.http.port = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be a number');

                defaults.server.http.port = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be an integer');

                defaults.server.http.port = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be greater than or equal to 1');

                defaults.server.http.port = 65536;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be less than or equal to 65535');

                delete defaults.server.http.port;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" is required');
            });

            it("server.whitelist is required && is array && contains strings", async () => {
                defaults.server.whitelist = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.whitelist" must be an array');

                defaults.server.whitelist = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.whitelist[0]" must be a string');

                delete defaults.server.whitelist;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.whitelist" is required');
            });

            it("timeout is required && is integer && >= 1", async () => {
                defaults.timeout = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"timeout" must be a number');

                defaults.timeout = 1.1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"timeout" must be an integer');

                defaults.timeout = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"timeout" must be greater than or equal to 1');

                delete defaults.timeout;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"timeout" is required');
            });
        });
    });
});
