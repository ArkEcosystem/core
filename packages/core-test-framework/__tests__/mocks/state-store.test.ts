import "jest-extended";

import { StateStore } from "@packages/core-test-framework/src/mocks";
import { Interfaces } from "@packages/crypto";

let blockData: Partial<Interfaces.IBlockData> = {
    id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
    version: 2,
    timestamp: 123132,
    height: 5,
};

let block = {
    data: blockData,
} as Partial<Interfaces.IBlock>;

const clear = () => {
    StateStore.setBlock(undefined);
    StateStore.setLastHeight(0);
};

describe("StateStore", () => {
    describe("default values", () => {
        it("getLastBlock should be undefined", async () => {
            expect(StateStore.instance.getLastBlock()).toBeUndefined();
        });

        it("getGenesisBlock should be undefined", async () => {
            expect(StateStore.instance.getGenesisBlock()).toBeUndefined();
        });

        it("getLastHeight should be 0", async () => {
            expect(StateStore.instance.getLastHeight()).toBe(0);
        });
    });

    describe("setBlock", () => {
        beforeEach(() => {
            clear();

            StateStore.setBlock(block);
        });

        it("getLastBlock should return mocked block", async () => {
            expect(StateStore.instance.getLastBlock()).toEqual(block);
        });

        it("getGenesisBlock should return mocked block", async () => {
            expect(StateStore.instance.getGenesisBlock()).toEqual(block);
        });
    });

    describe("setLastHeight", () => {
        beforeEach(() => {
            clear();

            StateStore.setLastHeight(5);
        });

        it("getLastHeight should return mocked height", async () => {
            expect(StateStore.instance.getLastHeight()).toEqual(5);
        });
    });
});
