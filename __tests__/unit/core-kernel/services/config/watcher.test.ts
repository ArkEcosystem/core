import "jest-extended";
import { dirSync, setGracefulCleanup } from "tmp";
import { writeFileSync } from "fs";
import delay from "delay";

import { Watcher } from "@packages/core-kernel/src/services/config/watcher";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/container";
import { ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

const configPath: string = dirSync().name;

let app: Application;
let container: interfaces.Container;
let watcher: Watcher;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(new ServiceProviderRepository());
    app.bind("path.config").toConstantValue(configPath);

    watcher = app.resolve<Watcher>(Watcher);
});

afterAll(() => setGracefulCleanup());

describe("Watcher", () => {
    it("should watch the configuration files and reboot on change", async () => {
        const spyReboot = jest.spyOn(app, "reboot");

        writeFileSync(`${configPath}/.env`, "old");

        await delay(1000);

        await watcher.start();

        expect(spyReboot).not.toHaveBeenCalled();

        writeFileSync(`${configPath}/.env`, "new");

        await delay(1000);

        expect(spyReboot).toHaveBeenCalled();

        await watcher.stop();
    });
});
