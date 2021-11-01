import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/events";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("EventDispatcherServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.EventDispatcherManager)).toBeFalse();
        expect(app.isBound(Identifiers.EventDispatcherService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.EventDispatcherManager)).toBeTrue();
        expect(app.isBound(Identifiers.EventDispatcherService)).toBeTrue();
        expect(app.get(Identifiers.EventDispatcherService)).toBeInstanceOf(MemoryEventDispatcher);
    });
});
