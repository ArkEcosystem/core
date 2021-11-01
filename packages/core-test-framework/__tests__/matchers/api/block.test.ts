import "@packages/core-test-framework/src/matchers/api/block";
import { Utils } from "@packages/crypto";

let block: any;

beforeEach(() => {
    // @ts-ignore
    block = {
        version: 0,
        timestamp: 8,
        height: 2,
        previousBlockHex: "b5ffa48d4b7e6937",
        previousBlock: "13114381566690093367",
        transactions: [],
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make("0"),
        totalFee: Utils.BigNumber.make("0"),
        reward: Utils.BigNumber.make("0"),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        blockSignature:
            "30450221009b3a032a50e79eca6f8d5851191e8edd2b36e6acf5f800632ddec5b968e6e09502200ee2cd4065386d77c3af255d416254a5946eeccf865d5413636a7b844b0bf581",
        idHex: "ca3fdcbcf44698b1",
        id: "14573609623304444081",
        createdAt: undefined,
        updatedAt: undefined,
    };
});

describe("Block", () => {
    describe("toBeValidBlock", () => {
        // TODO: Check why we need createdAt and updatedAt fields
        it("should be valid block", async () => {
            expect(block).toBeValidBlock();
        });

        it("should not be valid block", async () => {
            delete block.createdAt;
            delete block.updatedAt;
            expect(block).not.toBeValidBlock();
        });
    });

    describe("toBeValidBlock", () => {
        it("should not pass if not array", async () => {
            expect(block).not.toBeValidArrayOfBlocks();
        });

        it("should not pass if block is not valid", async () => {
            delete block.createdAt;
            delete block.updatedAt;
            expect([block]).not.toBeValidArrayOfBlocks();
        });

        it("should pass if block is valid", async () => {
            expect([block]).toBeValidArrayOfBlocks();
        });
    });
});
