import { Blocks, Managers, Utils } from "@arkecosystem/crypto";
import { Connection } from "typeorm";
import { getCustomRepository } from "typeorm";

import {
    clearCoreDatabase,
    getCoreDatabaseConnection,
    toBlockModel,
    toBlockModelWithTransactions,
} from "../__support__";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

let connection: Connection | undefined;

beforeAll(async () => {
    connection = await getCoreDatabaseConnection();
});

beforeEach(async () => {
    await clearCoreDatabase(connection);
});

const bip39 = new BIP39("generator's secret");
const block1 = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));
const block2 = bip39.forge([], {
    timestamp: block1.data.timestamp + 60,
    previousBlock: block1.data,
    reward: new Utils.BigNumber("100"),
});
const block3 = bip39.forge([], {
    timestamp: block2.data.timestamp + 120,
    previousBlock: block2.data,
    reward: new Utils.BigNumber("100"),
});

describe("BlockRepository.findLatest", () => {
    it("should return undefined when no blocks were added", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const block = await blockRepository.findLatest();
        expect(block).toBeUndefined();
    });

    it("should return latest added block", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1]);
        const latestBlock = await blockRepository.findLatest();
        expect(latestBlock).toStrictEqual(toBlockModel(block1));
    });
});

describe("BlockRepository.findRecent", () => {
    it("should return many latest block ids", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const recentBlocks = await blockRepository.findRecent(2);
        expect(recentBlocks.length).toBe(2);
        expect(recentBlocks[0].id).toBe(block3.data.id);
        expect(recentBlocks[1].id).toBe(block2.data.id);
    });
});

describe("BlockRepository.findTop", () => {
    it("should return many latest blocks", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const recentBlocks = await blockRepository.findTop(2);
        expect(recentBlocks).toStrictEqual([toBlockModel(block3), toBlockModel(block2)]);
    });
});

describe("BlockRepository.findByIdOrHeight", () => {
    it("should return block by id", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockById = await blockRepository.findByIdOrHeight(block2.data.id);
        expect(blockById).toStrictEqual(toBlockModel(block2));
    });

    it("should return block by height", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockByHeight = await blockRepository.findByIdOrHeight(block2.data.height);
        expect(blockByHeight).toStrictEqual(toBlockModel(block2));
    });
});

describe("BlockRepository.findByHeight", () => {
    it("should return block by height", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockByHeight = await blockRepository.findByHeight(block2.data.height);
        expect(blockByHeight).toStrictEqual(toBlockModel(block2));
    });
});

describe("BlockRepository.findByHeights", () => {
    it("should return blocks by height", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockByHeight = await blockRepository.findByHeights([block1.data.height, block3.data.height]);
        expect(blockByHeight).toStrictEqual([toBlockModel(block1), toBlockModel(block3)]);
    });
});

describe("BlockRepository.findByHeightRange", () => {
    it("should return blocks by height range", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockByHeight = await blockRepository.findByHeightRange(block1.data.height, block3.data.height);
        expect(blockByHeight).toStrictEqual([toBlockModel(block1), toBlockModel(block2), toBlockModel(block3)]);
    });
});

describe("BlockRepository.findByHeightRangeWithTransactions", () => {
    it("should return blocks with transactions by height range", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockByHeightWithTransactions = await blockRepository.findByHeightRangeWithTransactions(
            block1.data.height,
            block3.data.height,
        );
        expect(blockByHeightWithTransactions).toStrictEqual([
            toBlockModelWithTransactions(block1),
            toBlockModelWithTransactions(block2),
            toBlockModelWithTransactions(block3),
        ]);
    });
});

describe("BlockRepository.getStatistics", () => {
    it("should return statistics", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const statistics = await blockRepository.getStatistics();
        expect(statistics).toStrictEqual({
            count: "3",
            numberOfTransactions: "52",
            totalAmount: "12500000000000000",
            totalFee: "0",
        });
    });
});

describe("BlockRepository.getBlockRewards", () => {
    it("should return rewards groupped by generator key", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockRewards = await blockRepository.getBlockRewards();
        expect(blockRewards).toStrictEqual([
            { generatorPublicKey: block1.data.generatorPublicKey, rewards: "0" },
            { generatorPublicKey: bip39.publicKey, rewards: "200" },
        ]);
    });
});
