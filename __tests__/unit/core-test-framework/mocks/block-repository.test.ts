import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Models } from "@packages/core-database";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { BlockRepository } from "@packages/core-test-framework/src/mocks";

let block: Partial<Models.Block>;
let delegateForgedBlock: BlockRepository.DelegateForgedBlock;
let lastForgedBlock: BlockRepository.LastForgedBlock;

beforeAll(() => {
    const crypto = new CryptoSuite.CryptoSuite();

    block = {
        id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
        version: 2,
        timestamp: 123132,
    };

    delegateForgedBlock = {
        generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
        totalRewards: "2",
        totalFees: "2",
        totalProduced: 1,
    };

    lastForgedBlock = {
        generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
        id: "717093ac984e1a82a2de1fb334e92bda648547955417bc830d7825c515b5f2f9",
        height: "1",
        timestamp: 1,
    };
});

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
