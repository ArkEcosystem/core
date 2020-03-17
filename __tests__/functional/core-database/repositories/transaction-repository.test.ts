import { Blocks, Managers, Utils } from "@arkecosystem/crypto";
import { Connection } from "typeorm";
import { getCustomRepository } from "typeorm";

import { clearCoreDatabase, getCoreDatabaseConnection } from "../__support__";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";
import { TransactionRepository } from "../../../../packages/core-database/src/repositories/transaction-repository";

let connection: Connection | undefined;

beforeAll(async () => {
    connection = await getCoreDatabaseConnection();
});

beforeEach(async () => {
    await clearCoreDatabase(connection);
});

const block1 = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));

describe("TransactionRepository.findByBlockIds", () => {
    it("should find transactions by block id", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1]);
        const block1Transactions = await transactionRepository.findByBlockIds([block1.data.id]);
        expect(block1Transactions).toMatchObject(
            block1.transactions.map(t => ({
                id: t.data.id,
                blockId: block1.data.id,
                serialized: t.serialized,
            })),
        );
    });
});

describe("TransactionRepository.getForgedTransactionsIds", () => {
    it("should leave only ids that were previously saved", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1]);
        const forgedTransactionIds = await transactionRepository.getForgedTransactionsIds([
            block1.transactions[0].id,
            "123",
        ]);
        expect(forgedTransactionIds).toStrictEqual([block1.transactions[0].id]);
    });
});

describe("TransactionRepository.getStatistics", () => {
    it("should return statistics", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1]);
        const statistics = await transactionRepository.getStatistics();
        expect(statistics.count).toBe(block1.transactions.length.toString());
        expect(statistics.totalAmount).toBe(
            block1.transactions.reduce((s, t) => s.plus(t.data.amount), new Utils.BigNumber(0)).toString(),
        );
        expect(statistics.totalFee).toBe(
            block1.transactions.reduce((s, t) => s.plus(t.data.fee), new Utils.BigNumber(0)).toString(),
        );
    });
});
