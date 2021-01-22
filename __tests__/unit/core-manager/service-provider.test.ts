import "jest-extended";

import { Application, Container, Providers } from "@packages/core-kernel";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { ServiceProvider } from "@packages/core-manager/src/service-provider";
import { cloneDeep } from "lodash";
import path from "path";
import { dirSync, setGracefulCleanup } from "tmp";
import { AnySchema } from "@hapi/joi";

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
    defaults.server.https.tls.key = path.resolve(__dirname, "./__fixtures__/key.pem");
    defaults.server.https.tls.cert = path.resolve(__dirname, "./__fixtures__/server.crt");
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

        expect(app.isBound(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).not.toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not boot HTTP server and register actions when process is not manager", async () => {
        app.rebind(Container.Identifiers.ConfigFlags).toConstantValue({ processType: "core" });

        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).toBeFalse();
        expect(app.isBound(Identifiers.HTTPS)).toBeFalse();
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

        expect(app.isBound(Identifiers.HTTP)).not.toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).toBeTrue();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should dispose with HTTP and HTTPS server", async () => {
        const usedDefaults = { ...defaults };

        usedDefaults.server.http.enabled = true;
        usedDefaults.server.https.enabled = true;

        setPluginConfiguration(app, serviceProvider, usedDefaults);

        await expect(serviceProvider.register()).toResolve();

        await expect(serviceProvider.boot()).toResolve();

        expect(app.isBound(Identifiers.HTTP)).toBeTrue();
        expect(app.isBound(Identifiers.HTTPS)).toBeTrue();

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
                    key.includes("CORE_MONITOR_") ||
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

        describe("process.env.CORE_MONITOR_PUBLIC_IP", () => {
            it("should parse process.env.CORE_MONITOR_PUBLIC_IP", async () => {
                process.env.CORE_MONITOR_PUBLIC_IP = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.ip).toEqual(4000);
            });

            it("should throw if process.env.CORE_MONITOR_PUBLIC_IP is not number", async () => {
                process.env.CORE_MONITOR_PUBLIC_IP = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.ip" must be a number');
            });
        });

        describe("process.env.CORE_MONITOR_DISABLED", () => {
            it("should return true when process.env.CORE_MONITOR_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_MONITOR_DISABLED is present", async () => {
                process.env.CORE_MONITOR_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.enabled).toBeFalse();
            });
        });

        describe("process.env.CORE_MONITOR_HOST", () => {
            it("should parse process.env.CORE_MONITOR_HOST", async () => {
                process.env.CORE_MONITOR_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_MONITOR_PORT", () => {
            it("should parse process.env.CORE_MONITOR_PORT", async () => {
                process.env.CORE_MONITOR_PORT = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.port).toEqual(4000);
            });

            it("should throw if process.env.CORE_MONITOR_PORT is not number", async () => {
                process.env.CORE_MONITOR_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.http.port" must be a number');
            });
        });

        describe("process.env.CORE_MONITOR_SSL", () => {
            it("should return false when process.env.CORE_MONITOR_SSL is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toBeFalse();
            });

            it("should return false when process.env.CORE_MONITOR_SSL is present", async () => {
                process.env.CORE_MONITOR_SSL = "true";
                process.env.CORE_MONITOR_SSL_KEY = "path/to/key";
                process.env.CORE_MONITOR_SSL_CERT = "path/to/cert";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.enabled).toBeTrue();
            });

            it("should throw error if process.env.CORE_MONITOR_SSL = true and CORE_MONITOR_SSL_KEY or CORE_MONITOR_SSL_CERT is undefined", async () => {
                process.env.CORE_MONITOR_SSL = "true";
                process.env.CORE_MONITOR_SSL_KEY = "path/to/key";

                jest.resetModules();
                let result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.cert" is required');

                delete process.env.CORE_MONITOR_SSL_KEY;
                process.env.CORE_MONITOR_SSL_CERT = "path/to/cert";

                jest.resetModules();
                result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.tls.key" is required');
            });
        });

        describe("process.env.CORE_MONITOR_SSL_HOST", () => {
            it("should parse process.env.CORE_MONITOR_SSL_HOST", async () => {
                process.env.CORE_MONITOR_SSL_HOST = "127.0.0.1";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_MONITOR_SSL_PORT", () => {
            it("should parse process.env.CORE_MONITOR_SSL_PORT", async () => {
                process.env.CORE_MONITOR_SSL_PORT = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.https.port).toEqual(4000);
            });

            it("should throw if process.env.CORE_MONITOR_SSL_PORT is not number", async () => {
                process.env.CORE_MONITOR_SSL_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-manager/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"server.https.port" must be a number');
            });
        });
    });
});
