import "../mocks/";
import { blockchain } from "../mocks/blockchain";

import async from "async";
import delay from "delay";
import { Blockchain } from "../../../../packages/core-blockchain/src/blockchain";
import { QueueInterface } from "../../../../packages/core-blockchain/src/queue/interface";
import "../../../utils";

let fakeQueue;

class FakeQueue extends QueueInterface {
    /**
     * Create an instance of the process queue.
     */
    constructor(readonly blockchainInstance: Blockchain, readonly event: string) {
        super(blockchainInstance, event);

        this.queue = async.queue(async (item: any, cb) => {
            await delay(1000);
            return cb();
        }, 1);
    }
}

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";

    fakeQueue = new FakeQueue(blockchain as any, "fake");
});

describe("FakeQueue", () => {
    // fails on circleci, TODO re-enable
    it.skip("should remove successfully an item from the queue", async () => {
        const cb = jest.fn();
        fakeQueue.push(cb);

        expect(fakeQueue.queue.length()).toBe(1);

        fakeQueue.remove(obj => true); // removes everything, see async queue doc

        expect(fakeQueue.queue.length()).toBe(0);
    });
});
