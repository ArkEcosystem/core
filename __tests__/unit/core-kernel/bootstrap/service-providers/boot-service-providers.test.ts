import "jest-extended";

import { sleep } from "@arkecosystem/utils";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider, ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { BootServiceProviders } from "@packages/core-kernel/src/bootstrap/service-providers";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import {
    FaultyBootServiceProvider,
    RequiredFaultyBootServiceProvider,
    DeferredServiceProvider,
} from "./__stubs__/service-providers";
import { ServiceProviderCannotBeBooted } from "@packages/core-kernel/src/exceptions/plugins";
import { State } from "@packages/core-kernel/src/enums/events";

let app: Application;
let serviceProviderRepository: ServiceProviderRepository;
let logger: Record<string, jest.Mock>;

beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());

    serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

    logger = {
        notice: jest.fn(),
        warning: jest.fn(),
    };

    app.bind(Identifiers.LogService).toConstantValue(logger);
});

describe("BootServiceProviders", () => {
    it("RequiredFaultyBootServiceProvider", async () => {
        const serviceProvider: ServiceProvider = new RequiredFaultyBootServiceProvider();
        serviceProviderRepository.set("stub", serviceProvider);

        await expect(app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap()).rejects.toThrowError(
            new ServiceProviderCannotBeBooted(serviceProvider.name(), "Boot Error"),
        );
    });

    it("FaultyBootServiceProvider", async () => {
        const serviceProvider: ServiceProvider = new FaultyBootServiceProvider();
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

        expect(spyBoot).toHaveBeenCalled();
    });

    it("DeferredServiceProvider", async () => {
        const serviceProvider: ServiceProvider = new DeferredServiceProvider();
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

        expect(spyBoot).not.toHaveBeenCalled();
        expect(serviceProviderRepository.deferred("stub")).toBeTrue();
    });

    it("DeferredServiceProvider - failed", async () => {
        const serviceProvider: ServiceProvider = new DeferredServiceProvider();
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

        expect(spyBoot).not.toHaveBeenCalled();

        serviceProviderRepository.fail("stub");

        app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatchSync(State.BlockApplied);

        expect(spyBoot).not.toHaveBeenCalled();
        expect(serviceProviderRepository.deferred("stub")).toBeTrue();
    });

    it("DeferredServiceProvider - enableWhen", async () => {
        const serviceProvider: ServiceProvider = new DeferredServiceProvider();
        const spyBoot = jest.spyOn(serviceProvider, "boot");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

        serviceProviderRepository.defer("stub");

        process.env.DEFFERED_ENABLE = "true";

        app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatchSync(State.BlockApplied);

        await sleep(500);

        expect(spyBoot).toHaveBeenCalled();
    });

    it("DeferredServiceProvider - disableWhen", async () => {
        const serviceProvider: ServiceProvider = new DeferredServiceProvider();
        const spyDispose = jest.spyOn(serviceProvider, "dispose");
        serviceProviderRepository.set("stub", serviceProvider);

        await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

        serviceProviderRepository.load("stub");

        process.env.DEFFERED_DISABLE = "true";

        app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatchSync(State.BlockApplied);

        await sleep(500);

        expect(spyDispose).toHaveBeenCalled();
    });
});
