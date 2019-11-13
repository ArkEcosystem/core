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
import { InternalEvent, StateEvent } from "@packages/core-kernel/src/enums/events";

let app: Application;
let serviceProviderRepository: ServiceProviderRepository;
let logger: Record<string, jest.Mock>;

beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService)
        .to(MemoryEventDispatcher)
        .inSingletonScope();

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

        await app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatch(StateEvent.BlockApplied);

        expect(spyBoot).not.toHaveBeenCalled();
        expect(serviceProviderRepository.deferred("stub")).toBeTrue();
    });

    describe("DeferredServiceProvider - bootWhen", () => {
        it("should react to [StateEvent.BlockApplied]", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyBoot = jest.spyOn(serviceProvider, "boot");
            serviceProviderRepository.set("stub", serviceProvider);

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.defer("stub");

            process.env.DEFFERED_ENABLE = "true";

            await app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatch(StateEvent.BlockApplied);

            await sleep(500);

            expect(spyBoot).toHaveBeenCalled();
        });

        it("should react to [InternalEvent.ServiceProviderBooted]", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyBoot = jest.spyOn(serviceProvider, "boot");
            serviceProviderRepository.set("stub", serviceProvider);

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.defer("stub");

            process.env.DEFFERED_ENABLE = "true";

            await app
                .get<MemoryEventDispatcher>(Identifiers.EventDispatcherService)
                .dispatch(InternalEvent.ServiceProviderBooted, { name: "another-stub" });

            await sleep(500);

            expect(spyBoot).toHaveBeenCalled();
        });

        it("should not react to [InternalEvent.ServiceProviderBooted] if the booted provider is self", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyBoot = jest.spyOn(serviceProvider, "boot");
            serviceProviderRepository.set("stub", serviceProvider);

            process.env.DEFFERED_ENABLE = "false";

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.defer("stub");

            process.env.DEFFERED_ENABLE = "true";

            await app
                .get<MemoryEventDispatcher>(Identifiers.EventDispatcherService)
                .dispatch(InternalEvent.ServiceProviderBooted, { name: "stub" });

            await sleep(500);

            expect(spyBoot).not.toHaveBeenCalled();
        });
    });

    describe("DeferredServiceProvider - disposeWhen", () => {
        it("should react to [StateEvent.BlockApplied]", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyDispose = jest.spyOn(serviceProvider, "dispose");
            serviceProviderRepository.set("stub", serviceProvider);

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.load("stub");

            process.env.DEFFERED_DISABLE = "true";

            await app.get<MemoryEventDispatcher>(Identifiers.EventDispatcherService).dispatch(StateEvent.BlockApplied);

            await sleep(500);

            expect(spyDispose).toHaveBeenCalled();
        });

        it("should react to [InternalEvent.ServiceProviderBooted]", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyDispose = jest.spyOn(serviceProvider, "dispose");
            serviceProviderRepository.set("stub", serviceProvider);

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.load("stub");

            process.env.DEFFERED_DISABLE = "true";

            await app
                .get<MemoryEventDispatcher>(Identifiers.EventDispatcherService)
                .dispatch(InternalEvent.ServiceProviderBooted, { name: "another-stub" });

            await sleep(500);

            expect(spyDispose).toHaveBeenCalled();
        });

        it("should not react to [InternalEvent.ServiceProviderBooted] if the booted provider is self", async () => {
            const serviceProvider: ServiceProvider = new DeferredServiceProvider();
            const spyDispose = jest.spyOn(serviceProvider, "dispose");
            serviceProviderRepository.set("stub", serviceProvider);

            process.env.DEFFERED_ENABLE = "false";

            await app.resolve<BootServiceProviders>(BootServiceProviders).bootstrap();

            serviceProviderRepository.defer("stub");

            process.env.DEFFERED_ENABLE = "true";

            await app
                .get<MemoryEventDispatcher>(Identifiers.EventDispatcherService)
                .dispatch(InternalEvent.ServiceProviderBooted, { name: "stub" });

            await sleep(500);

            expect(spyDispose).not.toHaveBeenCalled();
        });
    });
});
