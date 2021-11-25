/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Crypto, Interfaces, Managers, Networks, State, Transactions, Utils } from "@packages/crypto";
import { IBlockData, IBlockHeader, IState } from "@packages/crypto/dist/interfaces";
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

type Range = {
    readonly from?: number;
    readonly count?: number;
};

async function getBlockHeaderBatch(range?: Range): Promise<IBlockHeader[]> {
    const from = range.from ?? 2;
    const count = range.count ?? 50000;

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

    const values = [from, from + count];
    const result = await client.query({ rowMode: "array", values, text });
    const batch: IBlockHeader[] = [];

    for (const row of result.rows) {
        batch.push({
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
        });
    }

    return batch;
}

async function* getBlockHeaderBatches(range?: Range): AsyncIterable<IBlockHeader[]> {
    const from = range.from ?? 2;
    const count = range.count ?? 50000;

    for (let height = from; ; height += count) {
        const batch = await getBlockHeaderBatch({ from: height, count });

        if (batch.length === 0) {
            break;
        }

        yield batch;
    }
}

async function* getBlockDataBatches(range?: Range): AsyncIterable<IBlockData[]> {
    const text = `
        SELECT block_height, serialized
        FROM transactions
        WHERE block_id = ANY($1::text[])
        ORDER BY block_height, sequence
    `;

    for await (const headers of getBlockHeaderBatches(range)) {
        const batch: IBlockData[] = [];
        const values = [headers.map((blockHeader) => blockHeader.id)];
        const result = await client.query({ rowMode: "array", values, text });
        const rows = result.rows.slice() as [number, Buffer][];

        for (const header of headers) {
            const transactions: Buffer[] = [];

            for (let i = 0; i < header.numberOfTransactions; i++) {
                const row = rows.shift();
                assert(header.height === row[0]);
                transactions.push(row[1]);
            }

            const d = { ...header, transactions };
            delete d.id;
            batch.push(d);
        }

        yield batch;
    }
}

async function getRounds(range?: Range): Promise<string[][]> {
    const from = range.from ?? 1;
    const count = range.count ?? 50000;

    const text = `
        SELECT round, public_key
        FROM rounds
        WHERE round >= $1 AND round < $2
        ORDER BY round ASC, balance DESC, public_key ASC
    `;

    const batch = [];
    const values = [from, from + count];
    const result = await client.query({ text, values, rowMode: "array" });

    for (const [round, publicKey] of result.rows) {
        const index = round - from;

        if (batch[index]) {
            batch[index].push(publicKey);
        } else {
            batch[index] = [publicKey];
        }
    }

    return batch;
}

test("once", async () => {
    const genesisBlockJson = Networks.mainnet.genesisBlock as Interfaces.IBlockJson;
    const genesisBlock = Blocks.BlockFactory.createGenesisBlockFromJson(genesisBlockJson);

    let state = State.StateFactory.createGenesisState(genesisBlock) as IState<IBlockHeader>;

    const count = 20000;
    const headers = await getBlockHeaderBatch({ from: 2, count: 50 + count * 51 });
    const rounds = await getRounds({ from: 2, count });

    const start = Date.now();

    for (const header of headers) {
        state = state.createNextState(header);

        if (!state.nextDelegates) {
            if (rounds.length === 0) {
                break;
            }

            state.applyRound(rounds.shift());
        }
    }

    console.log(`${Date.now() - start}ms`);

    expect(state.lastBlock.height).toBe(headers[headers.length - 1].height);
});

// test("replay", async () => {
//     const genesisBlockJson = Networks.mainnet.genesisBlock as Interfaces.IBlockJson;
//     const genesisBlock = Blocks.BlockFactory.createGenesisBlockFromJson(genesisBlockJson);

//     let rounds: string[][] = [];
//     let state = State.StateFactory.createGenesisState(genesisBlock) as IState<IBlockHeader>;

//     const start = Date.now();
//     let count = 0;

//     for await (const headers of getBlockHeaderBatches({ from: 2, count: 10000 * 51 })) {
//         for (const header of headers) {
//             state = state.createNextState(header);

//             if (!state.nextDelegates) {
//                 if (rounds.length === 0) {
//                     const nextRound = Crypto.Rounds.getRound(state.lastBlock.height + 1);
//                     rounds = await getRounds({ from: nextRound, count: 10000 });
//                 }

//                 state.applyRound(rounds.shift());
//             }
//         }

//         count += headers.length;
//         const ms = Date.now() - start;
//         const rate = (1000 * count) / ms;
//         const seconds = ms / 1000;
//         console.log(`${count} blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
//     }
// });
