import "jest-extended";

import { Blockchain } from "@packages/core-test-framework/src/mocks";
import { Interfaces } from "@packages/crypto";

let blockData: Partial<Interfaces.IBlockData> = {
    id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
    version: 2,
    timestamp: 123132,
    height: 5,
};

let block = {
    data: blockData,
} as Interfaces.IBlock;

const clear = () => {
    Blockchain.setBlock(undefined);
    Blockchain.setIsSynced(true);
};

describe("Blockchain", () => {
    describe("default values", () => {
        it("getLastBlock should return undefined", async () => {
            expect(Blockchain.instance.getLastBlock()).toBeUndefined();
        });

        it("getLastHeight should return undefined", async () => {
            expect(Blockchain.instance.getLastHeight()).toBe(1);
        });

        it("isSynced should return undefined", async () => {
            expect(Blockchain.instance.isSynced()).toBe(true);
        });
    });

    describe("setMockBlock", () => {
        beforeEach(() => {
            clear();

            Blockchain.setBlock(block);
        });

        it("getLastBlock should return mocked block", async () => {
            expect(Blockchain.instance.getLastBlock()).toEqual(block);
        });

        it("getLastHeight should return mocked block height", async () => {
            expect(Blockchain.instance.getLastHeight()).toEqual(5);
        });
    });

    describe("setIsSynced", () => {
        beforeEach(() => {
            clear();

            Blockchain.setIsSynced(false);
        });

        it("isSynced should return false", async () => {
            expect(Blockchain.instance.isSynced()).toEqual(false);
        });
    });

    describe("other", () => {
        beforeEach(() => {
            clear();
        });

        it("isSynced should return false", async () => {
            expect(Blockchain.instance.removeBlocks(3)).toResolve();
        });
    });
});
