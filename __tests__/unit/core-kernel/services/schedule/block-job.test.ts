import "jest-extended";
import { BlockJob } from "@packages/core-kernel/src/services/schedule/block-job";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { StateEvent } from "@packages/core-kernel/src/enums/events";

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

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 3 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 4 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 6 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 7 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 9 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 10 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every block", () => {
        const fn: Function = jest.fn();

        job.everyBlock().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every five blocks", () => {
        const fn: Function = jest.fn();

        job.everyFiveBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 5 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 6 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 10 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 11 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 15 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 16 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every ten blocks", () => {
        const fn: Function = jest.fn();

        job.everyTenBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 10 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 11 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 20 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 21 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 30 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 31 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every fifteen blocks", () => {
        const fn: Function = jest.fn();

        job.everyFifteenBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 15 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 16 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 30 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 31 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 45 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 46 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every thirty blocks", () => {
        const fn: Function = jest.fn();

        job.everyThirtyBlocks().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 30 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 31 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 60 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 61 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 90 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 91 });

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should execute every round", () => {
        const fn: Function = jest.fn();

        job.everyRound().execute(fn);

        expect(fn).not.toHaveBeenCalled();

        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 1 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 51 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 52 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 102 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 103 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 153 });
        eventDispatcher.dispatchSync(StateEvent.BlockReceived, { height: 154 });

        expect(fn).toHaveBeenCalledTimes(3);
    });
});
