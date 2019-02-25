import "@arkecosystem/core-test-utils";
import async from "async";
import { asValue } from "awilix";
import delay from "delay";
import { Blockchain } from "../../../../packages/core-blockchain/src/blockchain";
import { QueueInterface } from "../../../../packages/core-blockchain/src/queue/interface";
import { setUp, tearDown } from "../__support__/setup";

let fakeQueue;
let container;
let blockchain: Blockchain;

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

beforeAll(async () => {
    container = await setUp();

    process.env.CORE_SKIP_BLOCKCHAIN = "true";

    // Manually register the blockchain
    const plugin = require("../../../../packages/core-blockchain/src").plugin;

    blockchain = await plugin.register(container, {
        networkStart: false,
    });

    await container.register(
        "blockchain",
        asValue({
            name: "blockchain",
            version: "0.1.0",
            plugin: blockchain,
            options: {},
        }),
    );
});

afterAll(async () => {
    await tearDown();
});

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";

    fakeQueue = new FakeQueue(blockchain, "fake");
});

describe("FakeQueue", () => {
    it("should remove successfully an item from the queue", async () => {
        const cb = jest.fn();
        fakeQueue.push(cb);

        expect(fakeQueue.queue.length()).toBe(1);

        fakeQueue.remove(obj => true); // removes everything, see async queue doc

        expect(fakeQueue.queue.length()).toBe(0);
    });
});
