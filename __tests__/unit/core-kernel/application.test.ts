import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { NetworkCannotBeDetermined } from "@packages/core-kernel/src/exceptions/config";
import { DirectoryCannotBeFound } from "@packages/core-kernel/src/exceptions/filesystem";
import { Container, Identifiers, injectable, interfaces } from "@packages/core-kernel/src/ioc";
import { ServiceProvider, ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { resolve } from "path";
import { dirSync } from "tmp";

@injectable()
class StubClass {}

class StubServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}

    public name(): string {
        return "name";
    }

    public version(): string {
        return "version";
    }
}

let app: Application;
let container: interfaces.Container;
let logger: Record<string, Function>;

beforeEach(() => {
    container = new Container();

    app = new Application(container);

    logger = {
        error: jest.fn(),
        notice: jest.fn(),
        debug: jest.fn(),
    };

    app.bind(Identifiers.LogService).toConstantValue(logger);

    container.snapshot();
});

afterEach(() => container.restore());

describe("Application", () => {
    it("should bootstrap the application", async () => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "testnet",
                paths: { config: resolve(__dirname, "./__stubs__/config") },
            },
        });

        expect(app.dirPrefix()).toBe("ark/testnet");
    });

    it("should bootstrap the application with a config path from process.env", async () => {
        process.env.CORE_PATH_CONFIG = resolve(__dirname, "./__stubs__/config");

        await app.bootstrap({
            flags: { token: "ark", network: "testnet" },
        });

        expect(app.configPath()).toBe(process.env.CORE_PATH_CONFIG);
    });

    it("should fail to bootstrap the application if no token is provided", async () => {
        await expect(
            app.bootstrap({
                flags: { network: "testnet", paths: { config: resolve(__dirname, "./__stubs__/config") } },
            }),
        ).rejects.toThrowError(new NetworkCannotBeDetermined());
    });

    it("should fail to bootstrap the application if no network is provided", async () => {
        await expect(
            app.bootstrap({
                flags: { token: "ark", paths: { config: resolve(__dirname, "./__stubs__/config") } },
            }),
        ).rejects.toThrowError(new NetworkCannotBeDetermined());
    });

    it("should boot the application", async () => {
        // Arrange
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        const serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

        const serviceProvider = app.resolve(StubServiceProvider);
        const spyRegister = jest.spyOn(serviceProvider, "register");
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        serviceProviderRepository.set("stub", serviceProvider);

        expect(app.isBooted()).toBeFalse();

        // Act
        serviceProviderRepository.load("stub");
        await app.boot();

        // Assert
        expect(spyRegister).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
        expect(app.isBooted()).toBeTrue();
    });

    it("should reboot the application", async () => {
        // Arrange
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        const serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

        const serviceProvider = app.resolve(StubServiceProvider);
        const spyRegister = jest.spyOn(serviceProvider, "register");
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        const spyDispose = jest.spyOn(serviceProvider, "dispose");
        serviceProviderRepository.set("stub", serviceProvider);

        // Act
        serviceProviderRepository.load("stub");
        await app.reboot();

        // Assert
        expect(spyRegister).toHaveBeenCalled();
        expect(spyBoot).toHaveBeenCalled();
        expect(spyDispose).toHaveBeenCalled();
        expect(app.isBooted()).toBeTrue();
    });

    it("should get and set the given configuration value", () => {
        app.get<ConfigRepository>(Identifiers.ConfigRepository).merge({ key: "Hello World" });

        expect(app.config("key")).toBe("Hello World");

        expect(app.config("key", "new")).toBe("new");
    });

    it("should return the directory prefix", () => {
        app.bind(Identifiers.ApplicationDirPrefix).toConstantValue("Hello World");

        expect(app.dirPrefix()).toBe("Hello World");
    });

    it("should return the namespace", () => {
        app.bind(Identifiers.ApplicationNamespace).toConstantValue("Hello World");

        expect(app.namespace()).toBe("Hello World");
    });

    it("should return the version", () => {
        app.bind(Identifiers.ApplicationVersion).toConstantValue("Hello World");

        expect(app.version()).toBe("Hello World");
    });

    it("should return the token", () => {
        app.bind(Identifiers.ApplicationToken).toConstantValue("Hello World");

        expect(app.token()).toBe("Hello World");
    });

    it("should return the network", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("Hello World");

        expect(app.network()).toBe("Hello World");
    });

    it("should use the given network", () => {
        app.useNetwork("testnet");

        expect(app.network()).toBe("testnet");
    });

    it("should use the given network even if one is already set", () => {
        app.useNetwork("testnet");

        expect(app.network()).toBe("testnet");

        const spy = jest.spyOn(container, "unbind");

        app.useNetwork("mainnet");

        expect(app.network()).toBe("mainnet");
        expect(spy).toHaveBeenCalled();
    });

    it("should fail to set a path if it does not exist", () => {
        app.bind("path.data").toConstantValue(undefined);

        expect(() => app.dataPath()).toThrowError(new DirectoryCannotBeFound(undefined));

        expect(() => app.useDataPath(undefined)).toThrowError(new DirectoryCannotBeFound(undefined));
    });

    it("should set and get the given data path", () => {
        const path: string = dirSync().name;

        app.bind("path.data").toConstantValue(path);

        expect(app.dataPath()).toBe(path);
        expect(app.dataPath("file.txt")).toBe(`${path}/file.txt`);

        const pathNew: string = dirSync().name;
        app.useDataPath(pathNew);

        expect(app.dataPath()).toBe(pathNew);
        expect(app.dataPath("file.txt")).toBe(`${pathNew}/file.txt`);
    });

    it("should set and get the given config path", () => {
        const path: string = dirSync().name;

        app.bind("path.config").toConstantValue(path);

        expect(app.configPath()).toBe(path);
        expect(app.configPath("file.txt")).toBe(`${path}/file.txt`);

        const pathNew: string = dirSync().name;
        app.useConfigPath(pathNew);

        expect(app.configPath()).toBe(pathNew);
        expect(app.configPath("file.txt")).toBe(`${pathNew}/file.txt`);
    });

    it("should set and get the given cache path", () => {
        const path: string = dirSync().name;

        app.bind("path.cache").toConstantValue(path);

        expect(app.cachePath()).toBe(path);
        expect(app.cachePath("file.txt")).toBe(`${path}/file.txt`);

        const pathNew: string = dirSync().name;
        app.useCachePath(pathNew);

        expect(app.cachePath()).toBe(pathNew);
        expect(app.cachePath("file.txt")).toBe(`${pathNew}/file.txt`);
    });

    it("should set and get the given log path", () => {
        const path: string = dirSync().name;

        app.bind("path.log").toConstantValue(path);

        expect(app.logPath()).toBe(path);
        expect(app.logPath("file.txt")).toBe(`${path}/file.txt`);

        const pathNew: string = dirSync().name;
        app.useLogPath(pathNew);

        expect(app.logPath()).toBe(pathNew);
        expect(app.logPath("file.txt")).toBe(`${pathNew}/file.txt`);
    });

    it("should set and get the given temp path", () => {
        const path: string = dirSync().name;

        app.bind("path.temp").toConstantValue(path);

        expect(app.tempPath()).toBe(path);
        expect(app.tempPath("file.txt")).toBe(`${path}/file.txt`);

        const pathNew: string = dirSync().name;
        app.useTempPath(pathNew);

        expect(app.tempPath()).toBe(pathNew);
        expect(app.tempPath("file.txt")).toBe(`${pathNew}/file.txt`);
    });

    it("should return the environment file path", () => {
        const path: string = dirSync().name;

        app.bind("path.config").toConstantValue(path);

        expect(app.environmentFile()).toBe(`${path}/.env`);
    });

    it("should set and get the environment", () => {
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("development");

        expect(app.environment()).toBe("development");

        app.useEnvironment("production");

        expect(app.environment()).toBe("production");
    });

    it("should determine if the application is in production (by environment)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("devnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("development");

        expect(app.isProduction()).toBeFalse();

        app.unbind(Identifiers.ApplicationEnvironment);
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("production");

        expect(app.isProduction()).toBeTrue();
    });

    it("should determine if the application is in production (by network)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("devnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("development");

        expect(app.isProduction()).toBeFalse();

        app.unbind(Identifiers.ApplicationNetwork);
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("mainnet");

        expect(app.isProduction()).toBeTrue();
    });

    it("should determine if the application is in development (by environment)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("mainnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("production");

        expect(app.isDevelopment()).toBeFalse();

        app.unbind(Identifiers.ApplicationEnvironment);
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("development");

        expect(app.isDevelopment()).toBeTrue();
    });

    it("should determine if the application is in development (by network)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("mainnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("production");

        expect(app.isDevelopment()).toBeFalse();

        app.unbind(Identifiers.ApplicationNetwork);
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("devnet");

        expect(app.isDevelopment()).toBeTrue();
    });

    it("should determine if the application is in tests (by environment)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("mainnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("production");

        expect(app.runningTests()).toBeFalse();

        app.unbind(Identifiers.ApplicationEnvironment);
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("test");

        expect(app.runningTests()).toBeTrue();
    });

    it("should determine if the application is in tests (by network)", () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("mainnet");
        app.bind(Identifiers.ApplicationEnvironment).toConstantValue("production");

        expect(app.runningTests()).toBeFalse();

        app.unbind(Identifiers.ApplicationNetwork);
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("testnet");

        expect(app.runningTests()).toBeTrue();
    });

    it("should enable and disable maintenance mode", () => {
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        app.bind("path.temp").toConstantValue(dirSync().name);

        expect(app.isDownForMaintenance()).toBeFalse();

        app.enableMaintenance();

        expect(app.isDownForMaintenance()).toBeTrue();

        app.disableMaintenance();

        expect(app.isDownForMaintenance()).toBeFalse();
    });

    it("should terminate the application", async () => {
        // Arrange
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        const serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

        const serviceProvider = app.resolve(StubServiceProvider);
        const spyDispose = jest.spyOn(serviceProvider, "dispose");
        serviceProviderRepository.set("stub", serviceProvider);

        // Act
        serviceProviderRepository.load("stub");
        await app.boot();
        await app.terminate();

        // Assert
        expect(spyDispose).toHaveBeenCalled();
        expect(app.isBooted()).toBeFalse();
    });

    it("should terminate the application with a reason", async () => {
        // Arrange
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        const serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

        const serviceProvider = app.resolve(StubServiceProvider);
        const spyDispose = jest.spyOn(serviceProvider, "dispose");
        serviceProviderRepository.set("stub", serviceProvider);

        // Act
        serviceProviderRepository.load("stub");
        await app.boot();
        await app.terminate("Hello World");

        // Assert
        expect(logger.notice).toHaveBeenCalledWith("Hello World");
        expect(spyDispose).toHaveBeenCalled();
        expect(app.isBooted()).toBeFalse();
    });

    it("should terminate the application with an error", async () => {
        // Arrange
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        const serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

        const serviceProvider = app.resolve(StubServiceProvider);
        const spyDispose = jest.spyOn(serviceProvider, "dispose");
        serviceProviderRepository.set("stub", serviceProvider);

        // Act
        serviceProviderRepository.load("stub");
        const error = new Error("Hello World");
        await app.boot();
        await app.terminate(undefined, error);

        // Assert
        expect(logger.error).toHaveBeenCalledWith(error.stack);
        expect(spyDispose).toHaveBeenCalled();
        expect(app.isBooted()).toBeFalse();
    });

    it("should bind a value to the IoC container", () => {
        expect(app.isBound("key")).toBeFalse();

        app.bind("key").toConstantValue("value");

        expect(app.isBound("key")).toBeTrue();
    });

    it("should rebind a value to the IoC container", () => {
        expect(app.isBound("key")).toBeFalse();

        app.bind("key").toConstantValue("value");

        expect(app.get("key")).toBe("value");
        expect(app.isBound("key")).toBeTrue();

        app.rebind("key").toConstantValue("value-new");

        expect(app.get("key")).toBe("value-new");
    });

    it("should unbind a value from the IoC container", () => {
        app.bind("key").toConstantValue("value");

        expect(app.isBound("key")).toBeTrue();

        app.unbind("key");

        expect(app.isBound("key")).toBeFalse();
    });

    it("should get a value from the IoC container", () => {
        app.bind("key").toConstantValue("value");

        expect(app.get("key")).toBe("value");
    });

    it("should get tagged value from the IoC container", () => {
        app.bind("animal").toConstantValue("bear").whenTargetTagged("order", "carnivora");
        app.bind("animal").toConstantValue("dolphin").whenTargetTagged("order", "cetacea");

        expect(() => app.get("animal")).toThrow();
        expect(app.getTagged("animal", "order", "carnivora")).toBe("bear");
        expect(app.getTagged("animal", "order", "cetacea")).toBe("dolphin");
    });

    it("should resolve a value from the IoC container", () => {
        expect(app.resolve(StubClass)).toBeInstanceOf(StubClass);
    });
});
