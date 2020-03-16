import { Blocks, Managers, Utils } from "@arkecosystem/crypto";
import { getCustomRepository } from "typeorm";

import {
    clearCoreDatabase,
    getCoreDatabaseConnection,
    toBlockModel,
    toBlockModelWithTransactions,
} from "../__support__";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

const block1 = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));

const bip39 = new BIP39("generator's secret");

const block2Transactions = [];
const block2 = bip39.forge(block2Transactions, {
    timestamp: block1.data.timestamp + 60,
    previousBlock: block1.data,
    reward: new Utils.BigNumber(0),
});
const block3Transactions = [];
const block3 = bip39.forge(block3Transactions, {
    timestamp: block2.data.timestamp + 120,
    previousBlock: block2.data,
    reward: new Utils.BigNumber(0),
});

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
            await blockRepository.saveBlocks([block1]);
            const latestBlock = await blockRepository.findLatest();
            expect(latestBlock).toStrictEqual(toBlockModel(block1));
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
            await blockRepository.saveBlocks([block1, block2, block3]);
            const recentBlocks = await blockRepository.findRecent(2);
            expect(recentBlocks.length).toBe(2);
            expect(recentBlocks[0].id).toBe(block3.data.id);
            expect(recentBlocks[1].id).toBe(block2.data.id);
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
            await blockRepository.saveBlocks([block1, block2, block3]);
            const recentBlocks = await blockRepository.findTop(2);
            expect(recentBlocks).toStrictEqual([toBlockModel(block3), toBlockModel(block2)]);
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findByIdOrHeight", () => {
    it("should return block by id", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockById = await blockRepository.findByIdOrHeight(block2.data.id);
            expect(blockById).toStrictEqual(toBlockModel(block2));
        } finally {
            await connection.close();
        }
    });

    it("should return block by height", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockByHeight = await blockRepository.findByIdOrHeight(block2.data.height);
            expect(blockByHeight).toStrictEqual(toBlockModel(block2));
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findByHeight", () => {
    it("should return block by height", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockByHeight = await blockRepository.findByHeight(block2.data.height);
            expect(blockByHeight).toStrictEqual(toBlockModel(block2));
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findByHeights", () => {
    it("should return blocks by height", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockByHeight = await blockRepository.findByHeights([block1.data.height, block3.data.height]);
            expect(blockByHeight).toStrictEqual([toBlockModel(block1), toBlockModel(block3)]);
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findByHeightRange", () => {
    it("should return blocks by height range", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockByHeight = await blockRepository.findByHeightRange(block1.data.height, block3.data.height);
            expect(blockByHeight).toStrictEqual([toBlockModel(block1), toBlockModel(block2), toBlockModel(block3)]);
        } finally {
            await connection.close();
        }
    });
});

describe("BlockRepository.findByHeightRangeWithTransactions", () => {
    it("should return blocks by height range with transactions", async () => {
        const connection = await getCoreDatabaseConnection();

        try {
            await clearCoreDatabase(connection);
            const blockRepository = getCustomRepository(BlockRepository);
            await blockRepository.saveBlocks([block1, block2, block3]);
            const blockByHeight = await blockRepository.findByHeightRangeWithTransactions(
                block1.data.height,
                block3.data.height,
            );
            expect(blockByHeight).toStrictEqual([
                toBlockModelWithTransactions(block1),
                toBlockModelWithTransactions(block2),
                toBlockModelWithTransactions(block3),
            ]);
        } finally {
            await connection.close();
        }
    });
});
