import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/cache";
import { MemoryCacheStore } from "@packages/core-kernel/src/services/cache/drivers/memory";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

describe("CacheServiceProvider", () => {
    it(".register", async () => {
        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.CacheManager)).toBeTrue();
        expect(app.get(Identifiers.CacheService)).toBeInstanceOf(MemoryCacheStore);
    });
});
