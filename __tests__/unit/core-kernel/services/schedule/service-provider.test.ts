import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/schedule";
import { Schedule } from "@packages/core-kernel/src/services/schedule/schedule";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("LogServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.ScheduleService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ScheduleService)).toBeTrue();
        expect(app.get(Identifiers.ScheduleService)).toBeInstanceOf(Schedule);
    });
});
