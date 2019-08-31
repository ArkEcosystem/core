import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { ServiceProvider } from "@packages/core-kernel/src/services/schedule";
import { Schedule } from "@packages/core-kernel/src/services/schedule/schedule";

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
        expect(app.isBound(Identifiers.ScheduleService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ScheduleService)).toBeTrue();
        expect(app.get(Identifiers.ScheduleService)).toBeInstanceOf(Schedule);
    });
});
