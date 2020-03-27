import "jest-extended";

import { BlockRepository } from "@packages/core-test-framework/src/mocks";
import { Models } from "@packages/core-database";
import { Identities } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let block: Partial<Models.Block> = {
    id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
    version: 2,
    timestamp: 123132,
};

let delegateForgedBlock: BlockRepository.DelegateForgedBlock = {
    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
    totalRewards: "2",
    totalFees: "2",
    totalProduced: 1,
};

let lastForgedBlock: BlockRepository.LastForgedBlock = {
    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
    id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
    height: "1",
    timestamp: 1,
};

const clear = () => {
    BlockRepository.setBlock(undefined);
    BlockRepository.setBlocks([]);
    BlockRepository.setDelegateForgedBlocks([]);
    BlockRepository.setLastForgedBlocks([]);
};

describe("BlockRepository", () => {
    describe("default values", () => {
        it("findByIdOrHeight should return undefined", async () => {
            await expect(BlockRepository.instance.findByIdOrHeight(1)).resolves.toBeUndefined();
        });

        it("search should return empty paginated result", async () => {
            await expect(BlockRepository.instance.search({ criteria: [] })).resolves.toEqual({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });
        });

        it("searchByQuery should return empty paginated result", async () => {
            await expect(BlockRepository.instance.searchByQuery({}, { offset: 0, limit: 100 })).resolves.toEqual({
                rows: [],
                count: 0,
                countIsEstimate: false,
            });
        });

        it("getDelegatesForgedBlocks should return empty array", async () => {
            await expect(BlockRepository.instance.getDelegatesForgedBlocks()).resolves.toEqual([]);
        });

        it("getLastForgedBlocks should return empty array", async () => {
            await expect(BlockRepository.instance.getLastForgedBlocks()).resolves.toEqual([]);
        });
    });

    describe("setBlock", () => {
        beforeEach(() => {
            clear();

            BlockRepository.setBlock(block);
        });

        it("findByIdOrHeight should return mocked block", async () => {
            await expect(BlockRepository.instance.findByIdOrHeight(1)).resolves.toEqual(block);
        });
    });

    describe("setBlocks", () => {
        beforeEach(() => {
            clear();

            BlockRepository.setBlocks([block]);
        });

        it("search should return paginated result with mocked block", async () => {
            await expect(BlockRepository.instance.search({ criteria: [] })).resolves.toEqual({
                rows: [block],
                count: 1,
                countIsEstimate: false,
            });
        });

        it("search should return paginated result with mocked block", async () => {
            await expect(BlockRepository.instance.searchByQuery({}, { offset: 0, limit: 100 })).resolves.toEqual({
                rows: [block],
                count: 1,
                countIsEstimate: false,
            });
        });
    });

    describe("setDelegateForgedBlocks", () => {
        beforeEach(() => {
            clear();

            BlockRepository.setDelegateForgedBlocks([delegateForgedBlock]);
        });

        it("getDelegatesForgedBlocks should return mocked block", async () => {
            await expect(BlockRepository.instance.getDelegatesForgedBlocks()).resolves.toEqual([delegateForgedBlock]);
        });
    });

    describe("setLastForgedBlocks", () => {
        beforeEach(() => {
            clear();

            BlockRepository.setLastForgedBlocks([lastForgedBlock]);
        });

        it("getLastForgedBlocks should return mocked block", async () => {
            await expect(BlockRepository.instance.getLastForgedBlocks()).resolves.toEqual([lastForgedBlock]);
        });
    });
});
