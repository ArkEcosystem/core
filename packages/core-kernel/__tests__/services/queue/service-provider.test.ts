import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/queue";
import { MemoryQueue } from "@packages/core-kernel/src/services/queue/drivers/memory";
import { QueueFactory } from "@packages/core-kernel/src/types";
import { EventEmitter } from "events";

EventEmitter.prototype.constructor = Object.prototype.constructor;

let app: Application;

beforeEach(() => {
    app = new Application(new Container());
    app.bind(Identifiers.EventDispatcherService).toConstantValue({});
    app.bind(Identifiers.LogService).toConstantValue({});
});

describe("QueueServiceProvider", () => {
    it("should register the service", async () => {
        expect(app.isBound(Identifiers.QueueFactory)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.QueueFactory)).toBeTrue();
    });

    it("should create an instance of the MemoryQueue", async () => {
        await app.resolve<ServiceProvider>(ServiceProvider).register();

        await expect(app.get<QueueFactory>(Identifiers.QueueFactory)()).resolves.toBeInstanceOf(MemoryQueue);
    });
});
