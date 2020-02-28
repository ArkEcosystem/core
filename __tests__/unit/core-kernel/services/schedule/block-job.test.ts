import "jest-extended";
import { BlockJob } from "@packages/core-kernel/src/services/schedule/block-job";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { BlockEvent } from "@packages/core-kernel/src/enums/events";

let job: BlockJob;
let eventDispatcher: MemoryEventDispatcher;
beforeEach(() => {
    const container: interfaces.Container = new Container();
    eventDispatcher = container.resolve<MemoryEventDispatcher>(MemoryEventDispatcher);
    container.bind(Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);

    job = container.resolve(BlockJob);
});

describe("BlockJob", () => {
    it("should execute on cron", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every block", () => {
        const fn: Function = jest.fn();

        job.everyBlock().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });
        eventDispatcher.dispatchSync(BlockEvent.Received, { height: 1 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every five blocks", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every ten blocks", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every fifteen blocks", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every thirty blocks", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every round", () => {
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

        expect(fn).toHaveBeenCalledTimes(3);
    });
});
