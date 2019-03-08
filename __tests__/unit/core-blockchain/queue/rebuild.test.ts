import "../mocks/";
import { blockchain } from "../mocks/blockchain";
import { logger } from "../mocks/logger";

import delay from "delay";
import "../../../utils";
import { blocks2to100 } from "../../../utils/fixtures/testnet/blocks2to100";

let rebuildQueue;

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    jest.restoreAllMocks();

    const RebuildQueue = require("../../../../packages/core-blockchain/src/queue").RebuildQueue;
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

        const loggerError = jest.spyOn(logger, "error");

        const cb = jest.fn(() => true);
        rebuildQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(rebuildBlock).toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalledWith(`Failed to rebuild block in RebuildQueue: ${blocks2to100[3].height}`);
    });
});
