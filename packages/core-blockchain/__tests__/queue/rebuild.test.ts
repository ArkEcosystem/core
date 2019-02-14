import "@arkecosystem/core-test-utils";
import { asValue } from "awilix";
import delay from "delay";
import { blocks2to100 } from "../../../core-test-utils/src/fixtures/testnet/blocks2to100";
import { Blockchain } from "../../src/blockchain";
import { setUp, tearDown } from "../__support__/setup";

let rebuildQueue;
let container;
let blockchain: Blockchain;

beforeAll(async () => {
    container = await setUp();

    process.env.CORE_SKIP_BLOCKCHAIN = "true";

    // Manually register the blockchain
    const plugin = require("../../src").plugin;

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
    jest.restoreAllMocks();
    await tearDown();
});

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    jest.restoreAllMocks();

    const RebuildQueue = require("../../src/queue").RebuildQueue;
    rebuildQueue = new RebuildQueue(blockchain, "processEvent");
});

describe("RebuildQueue", () => {
    it("should call blockchain rebuildBlock when pushing a block to the queue", async () => {
        // @ts-ignore
        const rebuildBlock = jest.spyOn(blockchain, "rebuildBlock").mockReturnValue(true);

        const cb = jest.fn();
        rebuildQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(rebuildBlock).toHaveBeenCalled();
    });

    it.skip("should just call callback if queue is paused when pushing a block to the queue", async () => {
        // should call callback, but doesn't seem so... TODO
        // @ts-ignore
        const rebuildBlock = jest.spyOn(blockchain, "rebuildBlock").mockReturnValue(true);

        const cb = jest.fn(() => {
            throw new Error("uuuui");
        });
        rebuildQueue.queue.paused = true;
        rebuildQueue.queue.push(blocks2to100[3], cb);

        await delay(200);
        expect(rebuildBlock).not.toHaveBeenCalled();
        expect(cb).toHaveBeenCalled();
    });

    it("should log error and call callback when blockchain rebuildBlock throws", async () => {
        const rebuildBlock = jest.spyOn(blockchain, "rebuildBlock").mockImplementation(() => {
            throw new Error("wooo");
        });

        const loggerError = jest.spyOn(container.resolvePlugin("logger"), "error");

        const cb = jest.fn(() => true);
        rebuildQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(rebuildBlock).toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalledWith(`Failed to rebuild block in RebuildQueue: ${blocks2to100[3].height}`);
    });
});
