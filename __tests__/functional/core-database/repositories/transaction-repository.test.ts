import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Enums } from "@arkecosystem/crypto";
import { Connection } from "typeorm";
import { getCustomRepository } from "typeorm";

import { clearCoreDatabase, getCoreDatabaseConnection } from "../__support__";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";
import { TransactionRepository } from "../../../../packages/core-database/src/repositories/transaction-repository";
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

const transaction1 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("100")
    .sign("sender's secret")
    .build();
const transaction2 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("200")
    .sign("sender's secret")
    .build();
const transaction3 = crypto.TransactionManager.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("3")
    .fee("300")
    .vendorField("vendor field value")
    .sign("sender's secret")
    .build();

const bip39 = new BIP39(crypto.CryptoManager, crypto.BlockFactory, "generator's secret");
const block1 = crypto.BlockFactory.fromJson(
    crypto.CryptoManager.NetworkConfigManager.get("genesisBlock"),
    getBlockTimeLookup,
);
const block2 = bip39.forge(
    [transaction1.data],
    {
        timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime() - 60,
        previousBlock: block1.data,
        reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
    },
    getBlockTimeLookup,
);
const block3 = bip39.forge(
    [transaction2.data, transaction3.data],
    {
        timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime() - 30,
        previousBlock: block2.data,
        reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
    },
    getBlockTimeLookup,
);

describe("TransactionRepository.findByBlockIds", () => {
    it("should find transactions by block id", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1]);
        const block1Transactions = await transactionRepository.findByBlockIds([block1.data.id]);
        expect(block1Transactions).toMatchObject(
            block1.transactions.map((t) => ({
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
            block1.transactions
                .reduce(
                    (s, t) => s.plus(t.data.amount),
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(0),
                )
                .toString(),
        );
        expect(statistics.totalFee).toBe(
            block1.transactions
                .reduce((s, t) => s.plus(t.data.fee), crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(0))
                .toString(),
        );
    });
});

describe("TransactionRepository.getFeeStatistics", () => {
    it("should return fee statistics", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const feeStatistics = await transactionRepository.getFeeStatistics(crypto.CryptoManager, 14, 0);
        expect(feeStatistics).toStrictEqual([
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Transfer,
                avg: "200",
                max: "300",
                min: "100",
                sum: "600",
            },
        ]);
    });
});

describe("TransactionRepository.getSentTransactions", () => {
    it("should return nonce, amount, fee grouped by sender", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const sentTransactions = await transactionRepository.getSentTransactions();
        const senderTransaction = sentTransactions.find(
            (t) => t.senderPublicKey === crypto.CryptoManager.Identities.PublicKey.fromPassphrase("sender's secret"),
        );
        expect(senderTransaction).toStrictEqual({
            senderPublicKey: transaction1.data.senderPublicKey,
            nonce: "3",
            amount: "300",
            fee: "600",
        });
    });
});

describe("TransactionRepository.findReceivedTransactions", () => {
    it("should return transfer amount grouped by recipient", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const receivedTransactions = await transactionRepository.findReceivedTransactions();
        const recipientTransaction = receivedTransactions.find((t) => t.recipientId === transaction1.data.recipientId);
        expect(recipientTransaction).toStrictEqual({
            recipientId: transaction1.data.recipientId,
            amount: "300",
        });
    });
});

describe("TransactionRepository.findByType", () => {
    it("should find transactions by type", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const transferTransactions = await transactionRepository.findByType(
            Enums.TransactionType.Transfer,
            Enums.TransactionTypeGroup.Core,
        );
        const foundTransaction1 = transferTransactions.find((t) => t.id === transaction1.id);
        const foundTransaction2 = transferTransactions.find((t) => t.id === transaction2.id);
        const foundTransaction3 = transferTransactions.find((t) => t.id === transaction3.id);
        expect(foundTransaction1).not.toBeUndefined();
        expect(foundTransaction2).not.toBeUndefined();
        expect(foundTransaction3).not.toBeUndefined();
        expect(foundTransaction1["blockHeight"]).toBe(2);
        expect(foundTransaction2["blockHeight"]).toBe(3);
        expect(foundTransaction3["blockHeight"]).toBe(3);
    });
});

describe("TransactionRepository.findByHtlcLocks", () => {
    it("should find htlc claims and refunds by lock ids", async () => {
        const htlcLock = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "0".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("4")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcClaim = crypto.TransactionManager.BuilderFactory.htlcClaim()
            .htlcClaimAsset({
                lockTransactionId: htlcLock.id,
                unlockSecret: "1".repeat(64),
            })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("5")
            .sign("sender's secret")
            .build();
        const block4 = bip39.forge(
            [htlcLock.data, htlcClaim.data],
            {
                timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(),
                previousBlock: block3.data,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
            },
            getBlockTimeLookup,
        );

        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3, block4]);
        const unlockTransactions = await transactionRepository.findByHtlcLocks([htlcLock.id]);

        expect(unlockTransactions.length).toBe(1);
        expect(unlockTransactions[0].id).toBe(htlcClaim.id);
    });
});

describe("TransactionRepository.getOpenHtlcLocks", () => {
    it("should find all htlc locks and add open field indicating if they are open", async () => {
        const htlcLock1 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "1".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("4")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcLock2 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "2".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("5")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcClaim1 = crypto.TransactionManager.BuilderFactory.htlcClaim()
            .htlcClaimAsset({ lockTransactionId: htlcLock1.id, unlockSecret: "1".repeat(64) })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("6")
            .sign("sender's secret")
            .build();
        const block4 = bip39.forge(
            [htlcLock1.data, htlcLock2.data, htlcClaim1.data],
            {
                timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(),
                previousBlock: block3.data,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
            },
            getBlockTimeLookup,
        );

        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3, block4]);
        const lockTransactions = await transactionRepository.getOpenHtlcLocks();

        expect(lockTransactions.length).toBe(1);
        expect(lockTransactions[0].id).toBe(htlcLock2.id);
    });
});

describe("TransactionRepository.getClaimedHtlcLockBalances", () => {
    it("should return sum of claimed amounts grouped by recipients", async () => {
        const htlcLock1 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "1".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("4")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcLock2 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "2".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("5")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcClaim1 = crypto.TransactionManager.BuilderFactory.htlcClaim()
            .htlcClaimAsset({ lockTransactionId: htlcLock1.id, unlockSecret: "1".repeat(64) })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("6")
            .sign("sender's secret")
            .build();
        const htlcClaim2 = crypto.TransactionManager.BuilderFactory.htlcClaim()
            .htlcClaimAsset({ lockTransactionId: htlcLock2.id, unlockSecret: "1".repeat(64) })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("7")
            .sign("sender's secret")
            .build();
        const block4 = bip39.forge(
            [htlcLock1.data, htlcLock2.data, htlcClaim1.data, htlcClaim2.data],
            {
                timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(),
                previousBlock: block3.data,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
            },
            getBlockTimeLookup,
        );

        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3, block4]);
        const claimedBalances = await transactionRepository.getClaimedHtlcLockBalances();

        expect(claimedBalances).toStrictEqual([
            {
                recipientId: htlcLock1.data.recipientId,
                claimedBalance: "200",
            },
        ]);
    });
});

describe("TransactionRepository.getRefundedHtlcLockBalances", () => {
    it("should return sum of claimed amounts grouped by recipients", async () => {
        const htlcLock1 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "1".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("4")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcLock2 = crypto.TransactionManager.BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: "2".repeat(64),
                expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 100 },
            })
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("5")
            .fee("300")
            .sign("sender's secret")
            .build();
        const htlcRefund1 = crypto.TransactionManager.BuilderFactory.htlcRefund()
            .htlcRefundAsset({ lockTransactionId: htlcLock1.id })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("6")
            .sign("sender's secret")
            .build();
        const htlcRefund2 = crypto.TransactionManager.BuilderFactory.htlcRefund()
            .htlcRefundAsset({ lockTransactionId: htlcLock2.id })
            .amount("0")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("7")
            .sign("sender's secret")
            .build();
        const block4 = bip39.forge(
            [htlcLock1.data, htlcLock2.data, htlcRefund1.data, htlcRefund2.data],
            {
                timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(),
                previousBlock: block3.data,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
            },
            getBlockTimeLookup,
        );

        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3, block4]);
        const refundedBalances = await transactionRepository.getRefundedHtlcLockBalances();

        expect(refundedBalances).toStrictEqual([
            {
                senderPublicKey: htlcLock1.data.senderPublicKey,
                refundedBalance: "200",
            },
        ]);
    });
});

describe("TransactionRepository.findManyByExpression", () => {
    it("should return single entity by id equal expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const transactions1And2And3 = await transactionRepository.findManyByExpression({
            op: "or",
            expressions: [
                { property: "id", op: "equal", value: transaction1.id },
                { property: "id", op: "equal", value: transaction2.id },
                { property: "id", op: "equal", value: transaction3.id },
            ],
        });
        expect(transactions1And2And3[0].serialized).toEqual(transaction1.serialized);
        expect(transactions1And2And3[1].serialized).toEqual(transaction2.serialized);
        expect(transactions1And2And3[2].serialized).toEqual(transaction3.serialized);
    });
});

describe("TransactionRepository.listByExpression", () => {
    it("should return entities by id equal expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const listResult = await transactionRepository.listByExpression(
            {
                op: "or",
                expressions: [
                    { property: "id", op: "equal", value: transaction1.id },
                    { property: "id", op: "equal", value: transaction2.id },
                    { property: "id", op: "equal", value: transaction3.id },
                ],
            },
            [],
            { offset: 0, limit: 2 },
            { estimateTotalCount: false },
        );
        expect(listResult.count).toBe(3);
        expect(listResult.countIsEstimate).toBe(false);
        expect(listResult.rows.length).toBe(2);
        expect(listResult.rows[0].serialized).toEqual(transaction1.serialized);
        expect(listResult.rows[1].serialized).toEqual(transaction2.serialized);
    });

    it("should return entities and estimate count by id equal expression", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        const transactionRepository = getCustomRepository(TransactionRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const listResult = await transactionRepository.listByExpression(
            {
                op: "or",
                expressions: [
                    { property: "id", op: "equal", value: transaction1.id },
                    { property: "id", op: "equal", value: transaction2.id },
                    { property: "id", op: "equal", value: transaction3.id },
                ],
            },
            [],
            { offset: 0, limit: 2 },
            { estimateTotalCount: true },
        );
        expect(listResult.countIsEstimate).toBe(true);
        expect(listResult.rows.length).toBe(2);
        expect(listResult.rows[0].serialized).toEqual(transaction1.serialized);
        expect(listResult.rows[1].serialized).toEqual(transaction2.serialized);
    });
});
