import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";
import { AnySchema } from "joi";
import { cloneDeep } from "lodash";
import path from "path";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    notice: jest.fn(),
};

const mockEventDispatcher = {
    listen: jest.fn(),
};

const setPluginConfiguration = (app: Application, serviceProvider: ServiceProvider, configuration: any) => {
    const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
    const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-manager", configuration);

    serviceProvider.setConfig(instance);
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "manager" });
    app.bind(Container.Identifiers.FilesystemService).toConstantValue({});
    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    app.bind(Container.Identifiers.WalletAttributes).toConstantValue({});

    defaults.watcher.storage = dirSync().name + "/events.sqlite";
    defaults.logs.storage = dirSync().name + "/logs.sqlite";
    defaults.server.https.tls.key = path.join(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.join(__dirname, "./__fixtures__/server.crt");
});

afterEach(() => {
    setGracefulCleanup();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should contain required core-snapshot dependency when processType is equal manager", async () => {
        await expect(serviceProvider.dependencies()).toEqual([
            { name: "@arkecosystem/core-snapshots", required: true },
        ]);
    });

    it("should not contain dependencies when processType is not equal manager", async () => {
        app.rebind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "core" });

        await expect(serviceProvider.dependencies()).toEqual([]);
    });

    it("should register", async () => {
        const usedDefaults = cloneDeep(defaults);

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot and dispose HTTP server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP_JSON_RPC)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS_JSON_RPC)).not.toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not boot HTTP server and register actions when process is not manager", async () => {
        app.rebind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "core" });

        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP_JSON_RPC)).toBeFalse();
        expect(app.isBound(Identifiers.HTTPS_JSON_RPC)).toBeFalse();
        expect(app.isBound(Identifiers.ActionReader)).toBeFalse();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot and dispose HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = false;
        usedDefaults.server.https.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP_JSON_RPC)).not.toBeTrue();
        expect(app.isBound(Identifiers.HTTPS_JSON_RPC)).toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should dispose with HTTP and HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;
        usedDefaults.server.https.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP_JSON_RPC)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS_JSON_RPC)).toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot event listener", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.watcher.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        const mockEventListener = {
            boot: jest.fn(),
        };

        app.unbind(Identifiers.EventsListener);

        app.bind(Identifiers.EventsListener).toConstantValue(mockEventListener);

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.EventsListener)).toBeTrue();
        expect(mockEventListener.boot).toHaveBeenCalledTimes(1);

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should boot with disabled individual watchers", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.watcher.enabled = true;

        usedDefaults.watcher.watch.queries = false;
        usedDefaults.watcher.watch.wallets = false;
        usedDefaults.logs.enabled = false;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        const mockEventListener = {
            boot: jest.fn(),
        };

        app.unbind(Identifiers.EventsListener);

        app.bind(Identifiers.EventsListener).toConstantValue(mockEventListener);

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.EventsListener)).toBeTrue();
        expect(mockEventListener.boot).toHaveBeenCalledTimes(1);

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (
                    key.includes("CORE_WATCHER_") ||
                    key.includes("CORE_WATCH_") ||
                    key.includes("CORE_MANAGER_") ||
                    key === "CORE_RESET_DATABASE"
                ) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-manager/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            // Watcher
            expect(result.value.watcher.enabled).toBeFalse();
            expect(result.value.watcher.resetDatabase).toBeFalse();
            expect(result.value.watcher.storage).toBeString();
            expect(result.value.watcher.watch.blocks).toBeTrue();
            expect(result.value.watcher.watch.errors).toBeTrue();
            expect(result.value.watcher.watch.queries).toBeTrue();
            expect(result.value.watcher.watch.queues).toBeTrue();
            expect(result.value.watcher.watch.rounds).toBeTrue();
            expect(result.value.watcher.watch.schedules).toBeTrue();
            expect(result.value.watcher.watch.transactions).toBeTrue();
            expect(result.value.watcher.watch.wallets).toBeTrue();
            expect(result.value.watcher.watch.webhooks).toBeTrue();

            // Logs
            expect(result.value.logs.enabled).toBeTrue();
            expect(result.value.logs.resetDatabase).toBeFalse();
            expect(result.value.logs.storage).toBeString();
            expect(result.value.logs.history).toBeNumber();

            // HTTP
            expect(result.value.server.http.enabled).toBeTrue();
            expect(result.value.server.http.host).toEqual("0.0.0.0");
            expect(result.value.server.http.port).toEqual(4005);

            // HTTPS
            expect(result.value.server.https.enabled).toBeFalse();
            expect(result.value.server.https.host).toEqual("0.0.0.0");
            expect(result.value.server.https.port).toEqual(8445);
            expect(result.value.server.https.tls.key).toBeUndefined();
            expect(result.value.server.https.tls.cert).toBeUndefined();

            // Plugins
            expect(result.value.plugins.whitelist).toEqual(["127.0.0.1", "::ffff:127.0.0.1"]);

            expect(result.value.plugins.tokenAuthentication.enabled).toBeFalse();

            expect(result.value.plugins.basicAuthentication.enabled).toBeFalse();
            expect(result.value.plugins.basicAuthentication.users).toEqual([]);

            // Other
            expect(result.value.archiveFormat).toEqual("zip");
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-manager/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_WATCHER_ENABLED", () => {
            it("should return false when process.env.CORE_WATCHER_ENABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.enabled).toBeFalse();
            });

            it("should return true when process.env.CORE_WATCHER_ENABLED is present", async () => {
                process.env.CORE_WATCHER_ENABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.enabled).toBeTrue();
            });
        });

        describe("process.env.CORE_RESET_DATABASE", () => {
            it("should return false when process.env.CORE_RESET_DATABASE is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.resetDatabase).toBeFalse();
                expect(result.value.logs.resetDatabase).toBeFalse();
            });

            it("should return true when process.env.CORE_RESET_DATABASE is present", async () => {
                process.env.CORE_RESET_DATABASE = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.resetDatabase).toBeTrue();
                expect(result.value.logs.resetDatabase).toBeTrue();
            });
        });

        describe("process.env.CORE_PATH_DATA", () => {
            it("should return path containing process.env.CORE_PATH_DATA", async () => {
                process.env.CORE_PATH_DATA = "dummy/path";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.storage).toEqual("dummy/path/events.sqlite");
                expect(result.value.logs.storage).toEqual("dummy/path/logs.sqlite");
            });
        });

        describe("process.env.CORE_WATCH_BLOCKS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_BLOCKS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.blocks).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_BLOCKS_DISABLED is present", async () => {
                process.env.CORE_WATCH_BLOCKS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.blocks).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_ERRORS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_ERRORS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.errors).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_ERRORS_DISABLED is present", async () => {
                process.env.CORE_WATCH_ERRORS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.errors).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_QUERIES_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_QUERIES_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.queries).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_QUERIES_DISABLED is present", async () => {
                process.env.CORE_WATCH_QUERIES_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.queries).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_QUEUES_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_QUEUES_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.queues).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_QUEUES_DISABLED is present", async () => {
                process.env.CORE_WATCH_QUEUES_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.queues).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_ROUNDS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_ROUNDS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.rounds).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_ROUNDS_DISABLED is present", async () => {
                process.env.CORE_WATCH_ROUNDS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.rounds).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_SCHEDULES_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_SCHEDULES_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.schedules).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_SCHEDULES_DISABLED is present", async () => {
                process.env.CORE_WATCH_SCHEDULES_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.schedules).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_TRANSACTIONS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_TRANSACTIONS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.transactions).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_TRANSACTIONS_DISABLED is present", async () => {
                process.env.CORE_WATCH_TRANSACTIONS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.transactions).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_WALLETS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_WALLETS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.wallets).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_WALLETS_DISABLED is present", async () => {
                process.env.CORE_WATCH_WALLETS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.wallets).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_WEBHOOKS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_WEBHOOKS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.webhooks).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_WEBHOOKS_DISABLED is present", async () => {
                process.env.CORE_WATCH_WEBHOOKS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.watcher.watch.webhooks).toBeFalse();
            });
        });

        describe("process.env.CORE_WATCH_LOGS_DISABLED", () => {
            it("should return true when process.env.CORE_WATCH_LOGS_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.logs.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_WATCH_LOGS_DISABLED is present", async () => {
                process.env.CORE_WATCH_LOGS_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.logs.enabled).toBeFalse();
            });
        });

        describe("process.env.CORE_MANAGER_PUBLIC_IP", () => {
            it("should parse process.env.CORE_MANAGER_PUBLIC_IP", async () => {
                process.env.CORE_MANAGER_PUBLIC_IP = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.ip).toEqual(4000);
            });

            it("should throw if process.env.CORE_MANAGER_PUBLIC_IP is not number", async () => {
                process.env.CORE_MANAGER_PUBLIC_IP = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.ip" must be a number');
            });
        });

        describe("process.env.CORE_MANAGER_DISABLED", () => {
            it("should return true when process.env.CORE_MANAGER_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_MANAGER_DISABLED is present", async () => {
                process.env.CORE_MANAGER_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeFalse();
            });
        });

        describe("process.env.CORE_MANAGER_HOST", () => {
            it("should parse process.env.CORE_MANAGER_HOST", async () => {
                process.env.CORE_MANAGER_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_MANAGER_PORT", () => {
            it("should parse process.env.CORE_MANAGER_PORT", async () => {
                process.env.CORE_MANAGER_PORT = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.port).toEqual(4000);
            });

            it("should throw if process.env.CORE_MANAGER_PORT is not number", async () => {
                process.env.CORE_MANAGER_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.http.port" must be a number');
            });
        });

        describe("process.env.CORE_MANAGER_SSL", () => {
            it("should return false when process.env.CORE_MANAGER_SSL is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toBeFalse();
            });

            it("should return false when process.env.CORE_MANAGER_SSL is present", async () => {
                process.env.CORE_MANAGER_SSL = "true";
                process.env.CORE_MANAGER_SSL_KEY = "path/to/key";
                process.env.CORE_MANAGER_SSL_CERT = "path/to/cert";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toBeTrue();
            });

            it("should throw error if process.env.CORE_MANAGER_SSL = true and CORE_MANAGER_SSL_KEY or CORE_MANAGER_SSL_CERT is undefined", async () => {
                process.env.CORE_MANAGER_SSL = "true";
                process.env.CORE_MANAGER_SSL_KEY = "path/to/key";

                jest.resetModules();
                let result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.cert" is required');

                delete process.env.CORE_MANAGER_SSL_KEY;
                process.env.CORE_MANAGER_SSL_CERT = "path/to/cert";

                jest.resetModules();
                result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.key" is required');
            });
        });

        describe("process.env.CORE_MANAGER_SSL_HOST", () => {
            it("should parse process.env.CORE_MANAGER_SSL_HOST", async () => {
                process.env.CORE_MANAGER_SSL_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_MANAGER_SSL_PORT", () => {
            it("should parse process.env.CORE_MANAGER_SSL_PORT", async () => {
                process.env.CORE_MANAGER_SSL_PORT = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.port).toEqual(4000);
            });

            it("should throw if process.env.CORE_MANAGER_SSL_PORT is not number", async () => {
                process.env.CORE_MANAGER_SSL_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.port" must be a number');
            });
        });

        describe("process.env.CORE_MONITOR_ARCHIVE_FORMAT", () => {
            it("should parse process.env.CORE_MONITOR_ARCHIVE_FORMAT", async () => {
                process.env.CORE_MONITOR_ARCHIVE_FORMAT = "gz";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.archiveFormat).toEqual("gz");
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-manager/src/defaults")).defaults;
            });

            it("watcher is required", async () => {
                delete defaults.watcher;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher" is required');
            });

            it("watcher.enabled is required && is boolean", async () => {
                defaults.watcher.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.enabled" must be a boolean');

                delete defaults.watcher.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.enabled" is required');
            });

            it("watcher.resetDatabase is required && is boolean", async () => {
                defaults.watcher.resetDatabase = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.resetDatabase" must be a boolean');

                delete defaults.watcher.resetDatabase;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.resetDatabase" is required');
            });

            it("watcher.storage is required && is string", async () => {
                defaults.watcher.storage = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.storage" must be a string');

                delete defaults.watcher.storage;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.storage" is required');
            });

            it("watcher.watch is required", async () => {
                delete defaults.watcher.watch;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch" is required');
            });

            it("watcher.watch.blocks is required && is boolean", async () => {
                defaults.watcher.watch.blocks = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.blocks" must be a boolean');

                delete defaults.watcher.watch.blocks;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.blocks" is required');
            });

            it("watcher.watch.errors is required && is boolean", async () => {
                defaults.watcher.watch.errors = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.errors" must be a boolean');

                delete defaults.watcher.watch.errors;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.errors" is required');
            });

            it("watcher.watch.queries is required && is boolean", async () => {
                defaults.watcher.watch.queries = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.queries" must be a boolean');

                delete defaults.watcher.watch.queries;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.queries" is required');
            });

            it("watcher.watch.queues is required && is boolean", async () => {
                defaults.watcher.watch.queues = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.queues" must be a boolean');

                delete defaults.watcher.watch.queues;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.queues" is required');
            });

            it("watcher.watch.rounds is required && is boolean", async () => {
                defaults.watcher.watch.rounds = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.rounds" must be a boolean');

                delete defaults.watcher.watch.rounds;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.rounds" is required');
            });

            it("watcher.watch.schedules is required && is boolean", async () => {
                defaults.watcher.watch.schedules = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.schedules" must be a boolean');

                delete defaults.watcher.watch.schedules;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.schedules" is required');
            });

            it("watcher.watch.transactions is required && is boolean", async () => {
                defaults.watcher.watch.transactions = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.transactions" must be a boolean');

                delete defaults.watcher.watch.transactions;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.transactions" is required');
            });

            it("watcher.watch.wallets is required && is boolean", async () => {
                defaults.watcher.watch.wallets = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.wallets" must be a boolean');

                delete defaults.watcher.watch.wallets;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.wallets" is required');
            });

            it("watcher.watch.webhooks is required && is boolean", async () => {
                defaults.watcher.watch.webhooks = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.webhooks" must be a boolean');

                delete defaults.watcher.watch.webhooks;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"watcher.watch.webhooks" is required');
            });

            it("logs is required && is boolean", async () => {
                delete defaults.logs;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs" is required');
            });

            it("logs.enabled is required && is boolean", async () => {
                defaults.logs.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.enabled" must be a boolean');

                delete defaults.logs.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.enabled" is required');
            });

            it("logs.resetDatabase is required && is boolean", async () => {
                defaults.logs.resetDatabase = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.resetDatabase" must be a boolean');

                delete defaults.logs.resetDatabase;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.resetDatabase" is required');
            });

            it("logs.storage is required && is string", async () => {
                defaults.logs.storage = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.storage" must be a string');

                delete defaults.logs.storage;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.storage" is required');
            });

            it("logs.history is required && is number", async () => {
                defaults.logs.history = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.history" must be a number');

                delete defaults.logs.history;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"logs.history" is required');
            });

            it("server is required", async () => {
                delete defaults.server;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" is required');
            });

            it("server.ip is optional && is number", async () => {
                defaults.server.ip = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.ip" must be a number');

                delete defaults.server.ip;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("server.http is required", async () => {
                delete defaults.server.http;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" is required');
            });

            it("server.http.enabled is required && is boolean", async () => {
                defaults.server.http.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.enabled" must be a boolean');

                delete defaults.server.http.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.enabled" is required');
            });

            it("server.http.host is required && is string", async () => {
                defaults.server.http.host = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" must be a string');

                delete defaults.server.http.host;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" is required');
            });

            it("server.http.port is required && is number", async () => {
                defaults.server.http.port = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be a number');

                delete defaults.server.http.port;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" is required');
            });

            it("servers.http is required", async () => {
                delete defaults.server.https;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https" is required');
            });

            it("server.https.enabled is required && is boolean", async () => {
                defaults.server.https.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.enabled" must be a boolean');

                delete defaults.server.https.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.enabled" is required');
            });

            it("server.https.host is required && is string", async () => {
                defaults.server.https.host = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.host" must be a string');

                delete defaults.server.https.host;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.host" is required');
            });

            it("server.https.port is required && is number", async () => {
                defaults.server.https.port = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" must be a number');

                delete defaults.server.https.port;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.port" is required');
            });

            it("server.https.tls is required", async () => {
                delete defaults.server.https.tls;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls" is required');
            });

            it("server.https.tls.key is required when server.https.enabled && is string", async () => {
                delete defaults.server.https.tls.key;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.server.https.enabled = true;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.key" is required');

                defaults.server.https.tls.key = false;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.key" must be a string');
            });

            it("server.https.tls.cert is required when server.https.enabled && is string", async () => {
                delete defaults.server.https.tls.cert;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.server.https.enabled = true;
                defaults.server.https.tls.key = "path/to/key";
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.cert" is required');

                defaults.server.https.tls.cert = false;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.https.tls.cert" must be a string');
            });

            it("plugins is required", async () => {
                delete defaults.plugins;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins" is required');
            });

            it("plugins.whitelist is required && must contain strings", async () => {
                defaults.plugins.whitelist = [false];
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.whitelist[0]" must be a string');

                delete defaults.plugins.whitelist;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.whitelist" is required');
            });

            it("plugins.tokenAuthentication is required", async () => {
                delete defaults.plugins.tokenAuthentication;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.tokenAuthentication" is required');
            });

            it("plugins.tokenAuthentication.enabled is required && is boolean", async () => {
                defaults.plugins.tokenAuthentication.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.tokenAuthentication.enabled" must be a boolean');

                delete defaults.plugins.tokenAuthentication.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.tokenAuthentication.enabled" is required');
            });

            it("plugins.tokenAuthentication.token is required when plugins.tokenAuthentication.enabled && is string", async () => {
                delete defaults.plugins.tokenAuthentication.token;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.plugins.tokenAuthentication.enabled = true;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.tokenAuthentication.token" is required');

                defaults.plugins.tokenAuthentication.token = 123;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.tokenAuthentication.token" must be a string');
            });

            it("plugins.basicAuthentication is required", async () => {
                delete defaults.plugins.basicAuthentication;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication" is required');
            });

            it("plugins.basicAuthentication.enabled is required && is boolean", async () => {
                defaults.plugins.basicAuthentication.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.enabled" must be a boolean');

                delete defaults.plugins.basicAuthentication.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.enabled" is required');
            });

            it("plugins.basicAuthentication.secret is required when plugins.basicAuthentication.enabled && is string", async () => {
                delete defaults.plugins.basicAuthentication.secret;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.plugins.basicAuthentication.enabled = true;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.secret" is required');

                defaults.plugins.basicAuthentication.secret = 123;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.secret" must be a string');
            });

            it("plugins.basicAuthentication.users is required when plugins.basicAuthentication.enabled && is array", async () => {
                delete defaults.plugins.basicAuthentication.users;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.plugins.basicAuthentication.enabled = true;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.users" is required');

                defaults.plugins.basicAuthentication.users = 123;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.users" must be an array');
            });

            it("plugins.basicAuthentication.users[x].username is required && is string", async () => {
                defaults.plugins.basicAuthentication.users = [{}];
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.users[0].username" is required');

                defaults.plugins.basicAuthentication.users = [{ username: false }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"plugins.basicAuthentication.users[0].username" must be a string',
                );
            });

            it("plugins.basicAuthentication.users[x].password is required && is string", async () => {
                defaults.plugins.basicAuthentication.users = [{ username: "dummy" }];
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"plugins.basicAuthentication.users[0].password" is required');

                defaults.plugins.basicAuthentication.users = [{ username: "dummy", password: false }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"plugins.basicAuthentication.users[0].password" must be a string',
                );
            });

            it("archiveFormat is required && is string && is zip or gz", async () => {
                defaults.archiveFormat = "zip";
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.archiveFormat = "gz";
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();

                defaults.archiveFormat = "dummy";
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"archiveFormat" must be one of [zip, gz]');

                defaults.archiveFormat = 123;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"archiveFormat" must be one of [zip, gz]');

                delete defaults.archiveFormat;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"archiveFormat" is required');
            });
        });
    });
});
