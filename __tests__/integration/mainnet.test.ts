/* eslint-disable jest/no-focused-tests */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Interfaces, Managers, State, Transactions, Utils } from "@packages/crypto";
import assert from "assert";
import { Client } from "pg";

Managers.configManager.setFromPreset("mainnet");

Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainRegistrationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainResignationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainUpdateTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessRegistrationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessResignationTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessUpdateTransaction);
Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.EntityTransaction);

jest.setTimeout(60 * 60 * 1000);

const client = new Client({
    host: "localhost",
    user: "ark",
    password: "password",
    database: "ark_mainnet",
});

beforeAll(async () => await client.connect());
afterAll(async () => await client.end());

async function getBlockHeadersBatch(startHeight: number, batchSize: number): Promise<Interfaces.IBlockHeader[]> {
    const text = `
        SELECT
            id,
            version,
            timestamp,
            previous_block,
            height,
            number_of_transactions,
            total_amount,
            total_fee,
            reward,
            payload_length,
            payload_hash,
            generator_public_key,
            block_signature
        FROM blocks
        WHERE height >= $1 AND height < $2
        ORDER BY height
    `;

    const values = [startHeight, startHeight + batchSize];
    const result = await client.query({ rowMode: "array", values, text });

    return result.rows.map((row: any[]) => {
        return {
            id: row[0],
            version: row[1],
            timestamp: row[2],
            previousBlock: row[3],
            height: row[4],
            numberOfTransactions: row[5],
            totalAmount: Utils.BigNumber.make(row[6]),
            totalFee: Utils.BigNumber.make(row[7]),
            reward: Utils.BigNumber.make(row[8]),
            payloadLength: row[9],
            payloadHash: row[10],
            generatorPublicKey: row[11],
            blockSignature: row[12],
        };
    });
}

async function getBlockHeaders(heights: number[]): Promise<Interfaces.IBlockHeader[]> {
    const text = `
        SELECT
            id,
            version,
            timestamp,
            previous_block,
            height,
            number_of_transactions,
            total_amount,
            total_fee,
            reward,
            payload_length,
            payload_hash,
            generator_public_key,
            block_signature
        FROM blocks
        WHERE height = ANY($1::int[])
        ORDER BY height
    `;

    const values = [heights];
    const result = await client.query({ rowMode: "array", values, text });

    assert(result.rows.length === heights.length);

    return result.rows.map((row: any[]) => {
        return {
            id: row[0],
            version: row[1],
            timestamp: row[2],
            previousBlock: row[3],
            height: row[4],
            numberOfTransactions: row[5],
            totalAmount: Utils.BigNumber.make(row[6]),
            totalFee: Utils.BigNumber.make(row[7]),
            reward: Utils.BigNumber.make(row[8]),
            payloadLength: row[9],
            payloadHash: row[10],
            generatorPublicKey: row[11],
            blockSignature: row[12],
        };
    });
}

async function* getBlockHeadersFrom(startHeight: number, batchSize: number): AsyncIterable<Interfaces.IBlockHeader> {
    for (let i = 0; ; i++) {
        const batch = await getBlockHeadersBatch(i * batchSize + startHeight, batchSize);
        if (batch.length === 0) break;
        yield* batch;
    }
}

async function getBlockHeader(height: number): Promise<Interfaces.IBlockHeader> {
    const blocks = await getBlockHeaders([height]);
    return blocks[0];
}

async function getRoundDelegatesBatch(startNo: number, batchSize: number): Promise<Interfaces.IDelegate[][]> {
    const text = `
        SELECT round, public_key, balance
        FROM rounds
        WHERE round >= $1 AND round < $2
        ORDER BY round ASC, balance DESC, public_key ASC
    `;

    const batch = [];
    const values = [startNo, startNo + batchSize];
    const result = await client.query({ text, values, rowMode: "array" });

    for (const [round, publicKey, balance] of result.rows) {
        const index = round - startNo;
        const delegate = { publicKey, balance: Utils.BigNumber.make(balance) };

        if (batch[index]) {
            batch[index].push(delegate);
        } else {
            batch[index] = [delegate];
        }
    }

    return batch;
}

async function getRoundDelegates(no: number): Promise<Interfaces.IDelegate[]> {
    const batch = await getRoundDelegatesBatch(no, 1);
    assert(batch.length === 1);
    return batch[0];
}

async function getNumberOfTransactionsSum(height: number): Promise<number> {
    const text = `SELECT SUM(number_of_transactions) FROM blocks WHERE height <= $1`;
    const values = [height];
    const result = await client.query({ text, values, rowMode: "array" });
    return result.rows[0][0];
}

test("replay", async () => {
    const lastHeight = 80001;

    const genesisBlock = Blocks.BlockFactory.createGenesisBlock();
    const blocktimeHeights = State.Utils.getBlocktimeHeights().filter((h) => h < lastHeight);
    const blocktimeBlocks = await getBlockHeaders(blocktimeHeights);

    const finalizedBlock = genesisBlock;
    const justifiedBlock = genesisBlock;
    const lastBlock = await getBlockHeader(lastHeight);

    const forgedTransactionCount = await getNumberOfTransactionsSum(lastBlock.height);
    const finalizedTransactionCount = await getNumberOfTransactionsSum(finalizedBlock.height);

    const finalizedRound = State.Utils.getRound(finalizedBlock.height + 1);
    const finalizedDelegates = await getRoundDelegates(finalizedRound.no);
    const finalizedValidators = finalizedDelegates.map((d) => d.publicKey);

    const lastSlot = State.Utils.getSlot(blocktimeBlocks, lastBlock);
    const lastRound = State.Utils.getRound(lastBlock.height);
    const lastDelegates = await getRoundDelegates(lastRound.no);
    const lastValidators = lastDelegates.map((d) => d.publicKey);

    const currentRound = State.Utils.getRound(lastBlock.height + 1);
    const currentDelegates = await getRoundDelegates(currentRound.no);
    const currentValidators = currentDelegates.map((d) => d.publicKey);
    const currentForgers = State.Utils.getRoundShuffledForgers(currentRound, currentDelegates);

    let lastState = State.StateFactory.createState({
        forgedTransactionCount,
        finalizedTransactionCount,
        finalizedValidators,

        finalizedBlock,
        justifiedBlock,

        lastBlock,
        lastSlot,
        lastValidators,

        currentRound,
        currentDelegates,
        currentValidators,
        currentForgers,
    });

    let rounds = [];
    const start = Date.now();
    let count = 0;

    for await (const block of getBlockHeadersFrom(lastState.lastBlock.height + 1, 10 ** 5)) {
        const transitionState = lastState.chainBlock(block);

        if (transitionState.currentRound.no === transitionState.nextHeightRound.no) {
            lastState = transitionState.continueCurrentRound();
        } else {
            if (rounds.length === 0) {
                rounds = await getRoundDelegatesBatch(transitionState.nextHeightRound.no, 10 ** 4);
            }

            lastState = transitionState.startNewRound(rounds.shift());
        }

        if (++count % 10 ** 5 === 0) {
            const ms = Date.now() - start;
            const rate = (1000 * count) / ms;
            const seconds = ms / 1000;
            console.log(`${count / 10 ** 6}M blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
        }
    }
});
