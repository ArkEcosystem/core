import "jest-extended";

import { sleep } from "@arkecosystem/utils";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { Watcher } from "@packages/core-kernel/src/services/config/watcher";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { writeFileSync } from "fs";
import { dirSync, setGracefulCleanup } from "tmp";

const configPath: string = dirSync().name;

let app: Application;
let container: interfaces.Container;
let watcher: Watcher;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.LogService).toConstantValue({});
    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());
    app.bind("path.config").toConstantValue(configPath);

    watcher = app.resolve<Watcher>(Watcher);
});

afterAll(() => setGracefulCleanup());

describe("Watcher", () => {
    it("should watch the configuration files and reboot on change", async () => {
        const spyReboot = jest.spyOn(app, "reboot");

        writeFileSync(`${configPath}/.env`, "old");

        await sleep(1000);

        await watcher.boot();

        expect(spyReboot).not.toHaveBeenCalled();

        writeFileSync(`${configPath}/.env`, "new");

        await sleep(1000);

        expect(spyReboot).toHaveBeenCalled();

        await watcher.dispose();
    });
});
