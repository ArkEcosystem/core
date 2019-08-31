import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { ServiceProvider } from "@packages/core-kernel/src/services/log";
import { ConsoleLogger } from "@packages/core-kernel/src/services/log/drivers/console";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

describe("LogServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.LogManager)).toBeFalse();
        expect(app.isBound(Identifiers.LogService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.LogManager)).toBeTrue();
        expect(app.isBound(Identifiers.LogService)).toBeTrue();
        expect(app.get(Identifiers.LogService)).toBeInstanceOf(ConsoleLogger);
    });
});
