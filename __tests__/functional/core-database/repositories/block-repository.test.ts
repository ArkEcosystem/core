import { Utils } from "@arkecosystem/crypto";
import { getCustomRepository } from "typeorm";

import { clearCoreDatabase, getCoreDatabaseConnection } from "../__support__/app";
import { Block } from "../../../../packages/core-database/src/models/block";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";

const block1 = new Block();
block1.id = `${"0".repeat(63)}1`;
block1.version = 1;
block1.timestamp = 60;
block1.previousBlock = null;
block1.height = 1;
block1.numberOfTransactions = 0;
block1.totalAmount = new Utils.BigNumber(0);
block1.totalFee = new Utils.BigNumber(0);
block1.reward = new Utils.BigNumber(0);
block1.payloadLength = 0;
block1.payloadHash = "0".repeat(64);
block1.generatorPublicKey = "0".repeat(66);
block1.blockSignature = "0".repeat(256);

const block2 = new Block();
block2.id = `${"0".repeat(63)}2`;
block2.version = 1;
block2.timestamp = 120;
block2.previousBlock = block1.id;
block2.height = 2;
block2.numberOfTransactions = 0;
block2.totalAmount = new Utils.BigNumber(0);
block2.totalFee = new Utils.BigNumber(0);
block2.reward = new Utils.BigNumber(0);
block2.payloadLength = 0;
block2.payloadHash = "0".repeat(64);
block2.generatorPublicKey = "0".repeat(66);
block2.blockSignature = "0".repeat(256);

const block3 = new Block();
block3.id = `${"0".repeat(63)}3`;
block3.version = 1;
block3.timestamp = 180;
block3.previousBlock = block2.id;
block3.height = 3;
block3.numberOfTransactions = 0;
block3.totalAmount = new Utils.BigNumber(0);
block3.totalFee = new Utils.BigNumber(0);
block3.reward = new Utils.BigNumber(0);
block3.payloadLength = 0;
block3.payloadHash = "0".repeat(64);
block3.generatorPublicKey = "0".repeat(66);
block3.blockSignature = "0".repeat(256);

describe("BlockRepository.findLatest", () => {
    it("should return undefined when no blocks were added", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            const block = await blockRepository.findLatest();
            expect(block).toBeUndefined();
        } finally {
            await connection.close();
        }
    });

    it("should return latest added block", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.save(block1);
            const latestBlock = await blockRepository.findLatest();
            expect(latestBlock).toStrictEqual(block1);
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findRecent", () => {
    it("should return many latest block ids", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.save(block1);
            await blockRepository.save(block2);
            await blockRepository.save(block3);
            const recentBlocks = await blockRepository.findRecent(2);
            expect(recentBlocks.length).toBe(2);
            expect(recentBlocks[0].id).toBe(block3.id);
            expect(recentBlocks[1].id).toBe(block2.id);
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findTop", () => {
    it("should return many latest blocks", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.save(block1);
            await blockRepository.save(block2);
            await blockRepository.save(block3);
            const recentBlocks = await blockRepository.findTop(2);
            expect(recentBlocks).toStrictEqual([block3, block2]);
        } finally {
            await connection.close();
        }
    });
});
