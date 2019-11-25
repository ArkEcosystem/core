import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/cache";
import { MemoryCacheStore } from "@packages/core-kernel/src/services/cache/drivers/memory";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

let app: Application;
beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService)
        .to(MemoryEventDispatcher)
        .inSingletonScope();
});

describe("CacheServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.CacheManager)).toBeFalse();
        expect(app.isBound(Identifiers.CacheService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.CacheManager)).toBeTrue();
        expect(app.isBound(Identifiers.CacheService)).toBeTrue();
        expect(app.get(Identifiers.CacheService)).toBeInstanceOf(MemoryCacheStore);
    });
});
