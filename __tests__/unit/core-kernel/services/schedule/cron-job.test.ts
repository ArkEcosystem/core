import "jest-extended";

import { Container, Enums } from "@packages/core-kernel";
import { CronJob } from "@packages/core-kernel/src/services/schedule/cron-job";
import { Sandbox } from "@packages/core-test-framework";
import moment from "moment-timezone";
import { useFakeTimers } from "sinon";

let sandbox: Sandbox;
let job: CronJob;
let clock;
const mockEventDispatcher = {
    dispatch: jest.fn(),
};

const days: Record<string, string> = {
    monday: "2019-08-19 00:00:00",
    tuesday: "2019-08-20 00:00:00",
    wednesday: "2019-08-21 00:00:00",
    thursday: "2019-08-22 00:00:00",
    friday: "2019-08-23 00:00:00",
    saturday: "2019-08-24 00:00:00",
    sunday: "2019-08-25 00:00:00",
};

const expectExecutionAfterDelay = (callback: CronJob, minutes: number): void => {
    clock = useFakeTimers({
        now: 0,
    });

    const fn = jest.fn();

    callback.execute(fn);

    expect(fn).not.toHaveBeenCalled();

    const delay: number = minutes * 60 * 1000;
    for (let i = 0; i < 3; i++) {
        clock.tick(delay);
    }

    expect(fn).toHaveBeenCalledTimes(3);

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
        Enums.ScheduleEvent.CronJobFinished,
        expect.objectContaining({
            executionTime: expect.toBeNumber(),
            expression: expect.toBeString(),
        }),
    );
};

const expectExecutionOnDate = (callback: CronJob, day: string): void => {
    clock = useFakeTimers({
        now: moment(day).subtract(1, "second").valueOf(),
    });

    const fn = jest.fn();

    callback.execute(fn);

    expect(fn).not.toHaveBeenCalled();

    for (let i = 0; i < 3; i++) {
        clock.tick(1000);
    }

    expect(fn).toHaveBeenCalledTimes(1);

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
        Enums.ScheduleEvent.CronJobFinished,
        expect.objectContaining({
            executionTime: expect.toBeNumber(),
            expression: expect.toBeString(),
        }),
    );
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);

    job = sandbox.app.resolve<CronJob>(CronJob);
});

afterEach(() => clock.restore());

beforeAll(() => jest.useFakeTimers());

afterAll(() => jest.useRealTimers());

describe("CronJob", () => {
    it("should execute on cron", () => {
        expectExecutionAfterDelay(job.cron("*/3 * * * *"), 3);
    });

    it("should execute every minute", () => {
        expectExecutionAfterDelay(job.everyMinute(), 1);
    });

    it("should execute every five minutes", () => {
        expectExecutionAfterDelay(job.everyFiveMinutes(), 5);
    });

    it("should execute every ten minutes", () => {
        expectExecutionAfterDelay(job.everyTenMinutes(), 10);
    });

    it("should execute every fifteen minutes", () => {
        expectExecutionAfterDelay(job.everyFifteenMinutes(), 15);
    });

    it("should execute every thirty minutes", () => {
        expectExecutionAfterDelay(job.everyThirtyMinutes(), 30);
    });

    it("should execute hourly", () => {
        expectExecutionAfterDelay(job.hourly(), 60);
    });

    it("should execute hourly at", () => {
        expectExecutionAfterDelay(job.hourlyAt("30"), 60);
    });

    it("should execute daily", () => {
        expectExecutionAfterDelay(job.daily(), 1440);
    });

    it("should execute daily at", () => {
        expectExecutionAfterDelay(job.dailyAt("12", "00"), 1440);
    });

    it("should execute on weekdays", () => {
        expectExecutionOnDate(job.weekdays(), days.monday);
    });

    it("should execute on weekends", () => {
        expectExecutionOnDate(job.weekends(), days.saturday);
    });

    it("should execute on mondays", () => {
        expectExecutionOnDate(job.mondays(), days.monday);
    });

    it("should execute on tuesdays", () => {
        expectExecutionOnDate(job.tuesdays(), days.tuesday);
    });

    it("should execute on wednesdays", () => {
        expectExecutionOnDate(job.wednesdays(), days.wednesday);
    });

    it("should execute on thursdays", () => {
        expectExecutionOnDate(job.thursdays(), days.thursday);
    });

    it("should execute on fridays", () => {
        expectExecutionOnDate(job.fridays(), days.friday);
    });

    it("should execute on saturdays", () => {
        expectExecutionOnDate(job.saturdays(), days.saturday);
    });

    it("should execute on sundays", () => {
        expectExecutionOnDate(job.sundays(), days.sunday);
    });

    it("should execute weekly", () => {
        expectExecutionAfterDelay(job.weekly(), 10080);
    });

    it("should execute weekly on", () => {
        expectExecutionOnDate(job.weeklyOn("THU", "12", "30"), "2019-08-22 12:30:00");
    });

    it("should execute monthly", () => {
        expectExecutionAfterDelay(job.monthly(), 43800);
    });

    it("should execute monthly on", () => {
        expectExecutionOnDate(job.monthlyOn("22", "12", "30"), "2019-08-22 12:30:00");
    });

    it("should execute quarterly", () => {
        expectExecutionAfterDelay(job.quarterly(), 43800 * 3);
    });

    it("should execute yearly", () => {
        expectExecutionAfterDelay(job.yearly(), 525600);
    });
});
