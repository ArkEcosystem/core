import "../mocks/";
import { blockchain } from "../mocks/blockchain";
import { logger } from "../mocks/logger";

import delay from "delay";
import "../../../utils";
import { blocks2to100 } from "../../../utils/fixtures/testnet/blocks2to100";

let processQueue;

beforeEach(async () => {
    jest.restoreAllMocks();

    const ProcessQueue = require("../../../../packages/core-blockchain/src/queue").ProcessQueue;
    processQueue = new ProcessQueue(blockchain, "processEvent");
});

describe("ProcessQueue", () => {
    it("should call blockchain processBlock when pushing a block to the queue", async () => {
        // @ts-ignore
        const processBlock = jest.spyOn(blockchain, "processBlock").mockReturnValue(true);

        const cb = jest.fn();
        processQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(processBlock).toHaveBeenCalled();
    });

    it("should log error and call callback when blockchain processBlock throws", async () => {
        const processBlock = jest.spyOn(blockchain, "processBlock").mockImplementation(() => {
            throw new Error("wooo");
        });

        const loggerError = jest.spyOn(logger, "error");

        const cb = jest.fn();
        processQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(processBlock).toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalledWith(`Failed to process block in ProcessQueue: ${blocks2to100[3].height}`);
    });
});
