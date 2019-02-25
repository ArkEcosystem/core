import "@arkecosystem/core-test-utils";
import { asValue } from "awilix";
import delay from "delay";
import { blocks2to100 } from "../../../../packages/core-test-utils/src/fixtures/testnet/blocks2to100";
import { Blockchain } from "../../../../packages/core-blockchain/src/blockchain";
import { setUp, tearDown } from "../__support__/setup";

let processQueue;
let container;
let blockchain: Blockchain;

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
    jest.restoreAllMocks();
    await tearDown();
});

beforeEach(async () => {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
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

        const loggerError = jest.spyOn(container.resolvePlugin("logger"), "error");

        const cb = jest.fn();
        processQueue.push(blocks2to100[3], cb);

        await delay(200);
        expect(processBlock).toHaveBeenCalled();
        expect(loggerError).toHaveBeenCalledWith(`Failed to process block in ProcessQueue: ${blocks2to100[3].height}`);
    });
});
