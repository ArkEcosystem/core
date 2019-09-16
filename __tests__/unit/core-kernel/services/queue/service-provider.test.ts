import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/queue";
import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("QueueServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.QueueManager)).toBeFalse();
        expect(app.isBound(Identifiers.QueueService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.QueueManager)).toBeTrue();
        expect(app.isBound(Identifiers.QueueService)).toBeTrue();
        expect(app.get(Identifiers.QueueService)).toBeInstanceOf(MemoryQueue);
    });
});
