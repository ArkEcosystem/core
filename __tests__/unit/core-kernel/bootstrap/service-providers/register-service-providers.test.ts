import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { RegisterServiceProviders } from "@packages/core-kernel/src/bootstrap/service-providers";
import {
    InvalidPluginConfiguration,
    ServiceProviderCannotBeRegistered,
} from "@packages/core-kernel/src/exceptions/plugins";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import {
    PluginConfiguration,
    PluginManifest,
    ServiceProvider,
    ServiceProviderRepository,
} from "@packages/core-kernel/src/providers";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { ServiceProvider as ValidationServiceProvider } from "@packages/core-kernel/src/services/validation";

import {
    InvalidConfigurationServiceProvider,
    OptionalDependencyCannotBeFoundServiceProvider,
    OptionalDependencyVersionCannotBeSatisfiedServiceProvider,
    RequiredDependencyCannotBeFoundAsyncServiceProvider,
    RequiredDependencyCannotBeFoundServiceProvider,
    RequiredDependencyVersionCannotBeSatisfiedServiceProvider,
    RequiredInvalidConfigurationServiceProvider,
    StubServiceProvider,
    ValidConfigurationServiceProvider,
    RequiredDependencyVersionCanBeSatisfiedServiceProvider,
    RequiredDependencyCanBeFoundServiceProvider,
} from "./__stubs__/service-providers";

let app: Application;
let container: interfaces.Container;
let serviceProviderRepository: ServiceProviderRepository;
let logger: Record<string, jest.Mock>;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);

    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());

    serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

    logger = {
        notice: jest.fn(),
        warning: jest.fn(),
    };

    app.bind(Identifiers.LogService).toConstantValue(logger);
});

afterEach(() => container.restore());

describe("RegisterServiceProviders", () => {
    it("should bootstrap with a basic service provider", async () => {
        const serviceProvider: ServiceProvider = new StubServiceProvider();
        const spyRegister = jest.spyOn(serviceProvider, "register");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyRegister).toHaveBeenCalled();
    });

    it("should bootstrap if the configuration validation passes", async () => {
        const serviceProvider: ServiceProvider = new ValidConfigurationServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));

        const packageConfiguration: PluginConfiguration = app.resolve(PluginConfiguration);
        packageConfiguration.set("username", "johndoe");
        serviceProvider.setConfig(packageConfiguration);

        const spyRegister = jest.spyOn(serviceProvider, "register");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<ValidationServiceProvider>(ValidationServiceProvider).register();
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyRegister).toHaveBeenCalled();
        expect(serviceProviderRepository.failed("stub")).toBeFalse();
        expect(serviceProvider.config().get("username")).toBe("johndoe");
    });

    it("should mark the service provider as failed if the configuration validation fails", async () => {
        const serviceProvider: ServiceProvider = new InvalidConfigurationServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));

        const spyRegister = jest.spyOn(serviceProvider, "register");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<ValidationServiceProvider>(ValidationServiceProvider).register();
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyRegister).not.toHaveBeenCalled();
        expect(serviceProviderRepository.failed("stub")).toBeTrue();
    });

    it("should throw if the service provider is required and the configuration validation fails", async () => {
        const serviceProvider: ServiceProvider = new RequiredInvalidConfigurationServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<ValidationServiceProvider>(ValidationServiceProvider).register();

        await expect(app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap()).rejects.toThrowError(
            new ServiceProviderCannotBeRegistered(
                serviceProvider.name()!,
                new InvalidPluginConfiguration(serviceProvider.name()!, {
                    username: ['"username" is required'],
                }).message,
            ),
        );
    });

    it("should terminate if a required (boolean) dependency cannot be found", async () => {
        const serviceProvider: ServiceProvider = new RequiredDependencyCannotBeFoundServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);

        const spyNotice = jest.spyOn(logger, "notice");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyNotice).toHaveBeenCalledWith(
            'The "deps-required" package is required but missing. Please, make sure to install this library to take advantage of stub.',
        );
    });

    it("should bootstrap if a required dependency can be found", async () => {
        const serviceProvider: ServiceProvider = new RequiredDependencyCanBeFoundServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);
        serviceProviderRepository.set("dep", new StubServiceProvider());

        const spyNotice = jest.spyOn(logger, "notice");
        const spyTerminate = jest.spyOn(app, "terminate");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(serviceProviderRepository.failed("stub")).toBeFalse();
        expect(spyNotice).not.toHaveBeenCalled();
        expect(spyTerminate).not.toHaveBeenCalled();
    });

    it("should terminate if a required (async) dependency cannot be found", async () => {
        const serviceProvider: ServiceProvider = new RequiredDependencyCannotBeFoundAsyncServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);

        const spyNotice = jest.spyOn(logger, "notice");
        const spyTerminate = jest.spyOn(app, "terminate");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyNotice).toHaveBeenCalledWith(
            'The "deps-required" package is required but missing. Please, make sure to install this library to take advantage of stub.',
        );
        expect(spyTerminate).toHaveBeenCalled();
    });

    it("should mark the service provider as failed and log a warning if an optional dependency cannot be found", async () => {
        const serviceProvider: ServiceProvider = new OptionalDependencyCannotBeFoundServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);

        const spyWarning = jest.spyOn(logger, "warning");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyWarning).toHaveBeenCalledWith(
            'The "deps-optional" package is missing. Please, make sure to install this library to take advantage of stub.',
        );
        expect(serviceProviderRepository.failed("stub")).toBeTrue();
    });

    it("should bootstrap if a required dependency can satisfy the version", async () => {
        const serviceProvider: ServiceProvider = new RequiredDependencyVersionCanBeSatisfiedServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);
        serviceProviderRepository.set("dep", new StubServiceProvider());

        const spyNotice = jest.spyOn(logger, "notice");
        const spyTerminate = jest.spyOn(app, "terminate");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(serviceProviderRepository.failed("stub")).toBeFalse();
        expect(spyNotice).not.toHaveBeenCalled();
        expect(spyTerminate).not.toHaveBeenCalled();
    });

    it("should terminate if a required dependency cannot satisfy the version", async () => {
        const serviceProvider: ServiceProvider = new RequiredDependencyVersionCannotBeSatisfiedServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);
        serviceProviderRepository.set("dep", new StubServiceProvider());

        const spyNotice = jest.spyOn(logger, "notice");
        const spyTerminate = jest.spyOn(app, "terminate");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyNotice).toHaveBeenCalledWith('Expected "dep" to satisfy ">=2.0.0" but received "1.0.0".');
        expect(spyTerminate).toHaveBeenCalled();
    });

    it("should mark the service provider as failed and log a warning if an optional dependency cannot satisfy the version", async () => {
        const serviceProvider: ServiceProvider = new OptionalDependencyVersionCannotBeSatisfiedServiceProvider();
        serviceProvider.setManifest(app.resolve(PluginManifest));
        serviceProvider.setConfig(app.resolve(PluginConfiguration));
        serviceProviderRepository.set("stub", serviceProvider);
        serviceProviderRepository.set("dep", new StubServiceProvider());

        const spyWarning = jest.spyOn(logger, "warning");
        await app.resolve<RegisterServiceProviders>(RegisterServiceProviders).bootstrap();

        expect(spyWarning).toHaveBeenCalledWith('Expected "dep" to satisfy ">=2.0.0" but received "1.0.0".');
        expect(serviceProviderRepository.failed("stub")).toBeTrue();
    });
});
