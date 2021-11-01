import "jest-extended";

import { BlockEvent, ScheduleEvent } from "@packages/core-kernel/src/enums/events";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { BlockJob } from "@packages/core-kernel/src/services/schedule/block-job";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let job: BlockJob;
let eventDispatcher: MemoryEventDispatcher;

const delay = async (timeout) => {
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
};

const expectFinishedEventData = () => {
    return expect.objectContaining({
        executionTime: expect.toBeNumber(),
        blockCount: expect.toBeNumber(),
    });
};

beforeEach(() => {
    sandbox = new Sandbox();
    eventDispatcher = sandbox.app.resolve<MemoryEventDispatcher>(MemoryEventDispatcher);

    sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);

    job = sandbox.app.resolve<BlockJob>(BlockJob);
});

describe("BlockJob", () => {
    it("should execute on cron", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.cron(3).execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 3 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 4 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 6 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 7 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 9 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 10 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every block", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyBlock().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every five blocks", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyFiveBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 5 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 6 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 10 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 11 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 15 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 16 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every ten blocks", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyTenBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 10 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 11 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 20 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 21 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 30 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 31 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every fifteen blocks", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyFifteenBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 15 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 16 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 30 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 31 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 45 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 46 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every thirty blocks", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyThirtyBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 30 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 31 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 60 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 61 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 90 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 91 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });

    it("should execute every round", async () => {
        const spyOnDispatch = jest.spyOn(eventDispatcher, "dispatch");

        const fn: Function = jest.fn();

        job.everyRound().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 51 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 52 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 102 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 103 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 153 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 154 });

        await delay(100);

        expect(fn).toHaveBeenCalledTimes(3);

        expect(spyOnDispatch).toHaveBeenCalledTimes(3);
        expect(spyOnDispatch).toHaveBeenCalledWith(ScheduleEvent.BlockJobFinished, expectFinishedEventData());
    });
});
