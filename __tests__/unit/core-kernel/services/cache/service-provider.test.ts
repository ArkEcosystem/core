import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/cache";
import { MemoryCacheStore } from "@packages/core-kernel/src/services/cache/drivers/memory";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { CacheFactory } from "@packages/core-kernel/src/types";

let app: Application;
beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService).to(MemoryEventDispatcher).inSingletonScope();
});

describe("CacheServiceProvider", () => {
    it("should register the service", async () => {
        expect(app.isBound(Identifiers.CacheFactory)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.CacheFactory)).toBeTrue();
    });

    it("should create an instance of the MemoryCacheStore", async () => {
        await app.resolve<ServiceProvider>(ServiceProvider).register();

        await expect(app.get<CacheFactory<string, string>>(Identifiers.CacheFactory)()).resolves.toBeInstanceOf(
            MemoryCacheStore,
        );
    });
});
