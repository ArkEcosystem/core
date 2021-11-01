import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { BlockJob } from "@packages/core-kernel/src/services/schedule/block-job";
import { CronJob } from "@packages/core-kernel/src/services/schedule/cron-job";
import { Schedule } from "@packages/core-kernel/src/services/schedule/schedule";

let app: Application;
let container: interfaces.Container;
let scheduleService: Schedule;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.EventDispatcherService).to(MemoryEventDispatcher);

    scheduleService = app.resolve<Schedule>(Schedule);
});

describe("Schedule", () => {
    it("should return a cron job instance", () => {
        expect(scheduleService.cron()).toBeInstanceOf(CronJob);
    });

    it("should return a block job instance", () => {
        expect(scheduleService.block()).toBeInstanceOf(BlockJob);
    });
});
