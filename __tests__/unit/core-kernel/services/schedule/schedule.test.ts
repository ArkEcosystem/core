import "jest-extended";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { Schedule } from "@packages/core-kernel/src/services/schedule/schedule";
import { CronJob } from "@packages/core-kernel/src/services/schedule/cron-job";
import { BlockJob } from "@packages/core-kernel/src/services/schedule/block-job";

let app: Application;
let container: interfaces.Container;
let scheduleService: Schedule;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);

    scheduleService = app.resolve<Schedule>(Schedule);
});

describe("Schedule", () => {
    it("should return a cron job instance", () => {
        expect(scheduleService.cron()).toBeInstanceOf(CronJob);
    });

    it("should return a block job instance", () => {
        app.bind(Identifiers.EventDispatcherService).toConstantValue(
            app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher),
        );

        expect(scheduleService.block()).toBeInstanceOf(BlockJob);
    });
});
