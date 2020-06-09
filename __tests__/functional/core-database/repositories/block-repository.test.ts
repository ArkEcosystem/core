import { CryptoSuite } from "@arkecosystem/core-crypto";
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

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

const getBlockTimeLookup = (height: number): number => {
    throw new Error("Mocked getBlockTimeLookup");
};

let connection: Connection | undefined;

beforeAll(async () => {
    connection = await getCoreDatabaseConnection();
});

beforeEach(async () => {
    await clearCoreDatabase(connection);
});

const bip39 = new BIP39(crypto.CryptoManager, crypto.BlockFactory, "generator's secret");
const block1 = crypto.BlockFactory.fromJson(
    crypto.CryptoManager.NetworkConfigManager.get("genesisBlock"),
    getBlockTimeLookup,
);
const block2 = bip39.forge(
    [],
    {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
    },
    getBlockTimeLookup,
);
const block3 = bip39.forge(
    [],
    {
        timestamp: block2.data.timestamp + 120,
        previousBlock: block2.data,
        reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
    },
    getBlockTimeLookup,
);

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
            crypto.TransactionManager,
        );
        expect(blockByHeightWithTransactions).toStrictEqual([
            toBlockModelWithTransactions(block1, crypto.TransactionManager),
            toBlockModelWithTransactions(block2, crypto.TransactionManager),
            toBlockModelWithTransactions(block3, crypto.TransactionManager),
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
            numberOfTransactions: "153",
            totalAmount: "12500000000000000",
            totalFee: "0",
        });
    });
});

describe("BlockRepository.getBlockRewards", () => {
    it("should return rewards grouped by generator key", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blockRewards = await blockRepository.getBlockRewards();
        expect(blockRewards).toStrictEqual([
            { generatorPublicKey: bip39.publicKey, rewards: "200" },
            { generatorPublicKey: block1.data.generatorPublicKey, rewards: "0" },
        ]);
    });
});

describe("BlockRepository.getDelegatesForgedBlocks", () => {
    it("should return statistics grouped by generator key", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const delegatesForgedBlocks = await blockRepository.getDelegatesForgedBlocks();
        expect(delegatesForgedBlocks).toStrictEqual([
            {
                generatorPublicKey: bip39.publicKey,
                totalFees: "0",
                totalRewards: "200",
                totalProduced: "2",
            },
            {
                generatorPublicKey: block1.data.generatorPublicKey,
                totalFees: "0",
                totalRewards: "0",
                totalProduced: "1",
            },
        ]);
    });
});

describe("BlockRepository.getLastForgedBlocks", () => {
    it("should return last forged block for each generator key", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const lastForgedBlocks = await blockRepository.getLastForgedBlocks();
        expect(lastForgedBlocks).toStrictEqual([
            {
                generatorPublicKey: bip39.publicKey,
                id: block3.data.id,
                timestamp: block3.data.timestamp,
                height: 3,
            },
            {
                generatorPublicKey: block1.data.generatorPublicKey,
                id: block1.data.id,
                timestamp: block1.data.timestamp,
                height: 1,
            },
        ]);
    });
});

describe("BlockRepository.saveBlocks", () => {
    it("should save blocks", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const block1ById = await blockRepository.findById(block1.data.id);
        const block2ById = await blockRepository.findById(block2.data.id);
        const block3ById = await blockRepository.findById(block3.data.id);
        expect(block1ById).toStrictEqual(toBlockModel(block1));
        expect(block2ById).toStrictEqual(toBlockModel(block2));
        expect(block3ById).toStrictEqual(toBlockModel(block3));
    });
});

describe("BlockRepository.deleteBlocks", () => {
    it("should delete blocks", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        await blockRepository.deleteBlocks([block2.data, block3.data], crypto.CryptoManager);
        const block1ById = await blockRepository.findById(block1.data.id);
        const block2ById = await blockRepository.findById(block2.data.id);
        const block3ById = await blockRepository.findById(block3.data.id);
        expect(block1ById).toStrictEqual(toBlockModel(block1));
        expect(block2ById).toBeUndefined();
        expect(block3ById).toBeUndefined();
    });

    it("should throw when deleting blocks from the middle", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const promise = blockRepository.deleteBlocks([block2.data], crypto.CryptoManager);
        await expect(promise).rejects.toThrow("Removing blocks from the middle");
    });
});

describe("BlockRepository.findManyByExpression", () => {
    it("should return many entities by height greaterThanEqual expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const blocks2And3ByHeight = await blockRepository.findManyByExpression({
            property: "height",
            op: "greaterThanEqual",
            value: block2.data.height,
        });
        expect(blocks2And3ByHeight).toStrictEqual([toBlockModel(block2), toBlockModel(block3)]);
    });
});

describe("BlockRepository.listByExpression", () => {
    it("should return result page by height greaterThanEqual expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const listResult = await blockRepository.listByExpression(
            {
                property: "height",
                op: "greaterThanEqual",
                value: block1.data.height,
            },
            [
                { property: "height", direction: "desc" },
                { property: "id", direction: "desc" },
            ],
            { offset: 0, limit: 2 },
            { estimateTotalCount: false },
        );
        expect(listResult).toStrictEqual({
            rows: [toBlockModel(block3), toBlockModel(block2)],
            count: 3,
            countIsEstimate: false,
        });
    });

    it("should return result page and estimate count by height greaterThanEqual expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const listResult = await blockRepository.listByExpression(
            {
                property: "height",
                op: "greaterThanEqual",
                value: block1.data.height,
            },
            [
                { property: "height", direction: "desc" },
                { property: "id", direction: "desc" },
            ],
            { offset: 0, limit: 2 },
        );
        expect(listResult.countIsEstimate).toBe(true);
        expect(listResult.rows).toStrictEqual([toBlockModel(block3), toBlockModel(block2)]);
    });
});

describe("BlockRepository.deleteTopBlocks", () => {
    it("should delete blocks", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        await blockRepository.deleteTopBlocks(2, crypto.CryptoManager);
        const block1ById = await blockRepository.findById(block1.data.id);
        const block2ById = await blockRepository.findById(block2.data.id);
        const block3ById = await blockRepository.findById(block3.data.id);
        expect(block1ById).toStrictEqual(toBlockModel(block1));
        expect(block2ById).toBeUndefined();
        expect(block3ById).toBeUndefined();
    });
});
