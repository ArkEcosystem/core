/* eslint-disable jest/no-focused-tests */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Interfaces, Managers, Serde, State, Transactions, Utils } from "@packages/crypto";
import assert from "assert";
import fs from "fs";
import fsp from "fs/promises";
import { Client } from "pg";

type ITrustedBlockData = Interfaces.IBlockData & { readonly id: string };

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

async function getBlockHeadersBatch(start: number, size: number): Promise<Interfaces.IBlockHeader[]> {
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

    const values = [start, start + size];
    const result = await client.query({ rowMode: "array", values, text });
    const batch: Interfaces.IBlockHeader[] = [];

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

async function getBlockDataBatch(start: number, size: number): Promise<ITrustedBlockData[]> {
    const text = `
        SELECT block_height, serialized
        FROM transactions
        WHERE block_id = ANY($1::text[])
        ORDER BY block_height, sequence
    `;

    const headers = await getBlockHeadersBatch(start, size);
    const values = [headers.map((header) => header.id)];
    const result = await client.query({ rowMode: "array", values, text });
    const rows = result.rows.slice() as [number, Buffer][];
    const batch: ITrustedBlockData[] = [];

    for (const header of headers) {
        const transactions: Buffer[] = [];

        for (let i = 0; i < header.numberOfTransactions; i++) {
            const row = rows.shift();
            assert(header.height === row[0]);
            transactions.push(row[1]);
        }

        batch.push({ ...header, transactions });
    }

    return batch;
}

async function* getBlockHeaders(start: number, batchSize: number): AsyncIterable<Interfaces.IBlockHeader> {
    for (let i = 0; ; i++) {
        const batch = await getBlockHeadersBatch(i * batchSize + start, batchSize);
        if (batch.length === 0) break;
        yield* batch;
    }
}

async function* getBlockData(start: number, batchSize: number): AsyncIterable<ITrustedBlockData> {
    for (let i = 0; ; i++) {
        const batch = await getBlockDataBatch(i * batchSize + start, batchSize);
        if (batch.length === 0) break;
        yield* batch;
    }
}

async function getRoundsBatch(start: number, size: number): Promise<string[][]> {
    const text = `
        SELECT round, public_key
        FROM rounds
        WHERE round >= $1 AND round < $2
        ORDER BY round ASC, balance DESC, public_key ASC
    `;

    const batch = [];
    const values = [start, start + size];
    const result = await client.query({ text, values, rowMode: "array" });

    for (const [round, publicKey] of result.rows) {
        const index = round - start;

        if (batch[index]) {
            batch[index].push(publicKey);
        } else {
            batch[index] = [publicKey];
        }
    }

    return batch;
}

async function* dumpBlocks(filename: string, start: number, size: number): AsyncIterable<ITrustedBlockData> {
    const temp = Buffer.alloc(1 + 32 + 8 + 2 + 2 * 1024 ** 2);
    const writer = Serde.SerdeFactory.createWriter(temp);
    const f = await fsp.open(filename, "w");

    try {
        for await (const data of getBlockData(start, size)) {
            yield data;

            let idBuf: Buffer;
            const serialized = Blocks.Serializer.serialize(data);

            if (data.id.length === 64) {
                idBuf = Buffer.from(data.id, "hex");
            } else {
                idBuf = Buffer.alloc(8);
                idBuf.writeBigUInt64BE(BigInt(data.id));
            }

            writer.writeUInt8(idBuf.length);
            writer.writeUInt16LE(serialized.length);
            writer.writeBuffer(idBuf);
            writer.writeBuffer(serialized);
            await f.write(writer.getResult());
            writer.reset();
        }
    } finally {
        await f.close();
    }
}

async function* readBlocks(filename: string): AsyncIterable<ITrustedBlockData> {
    let temp = Buffer.alloc(0);
    let reader = Serde.SerdeFactory.createReader(temp);

    const stream = fs.createReadStream(filename, { highWaterMark: 4 * 1024 ** 2 });

    for await (const chunk of stream) {
        temp = Buffer.concat([reader.getRemainder(), chunk]);
        reader = Serde.SerdeFactory.createReader(temp);

        while (reader.getRemainderLength() >= 3) {
            const idBufSize = reader.readUInt8();
            const serializedSize = reader.readUInt16LE();

            if (reader.getRemainderLength() < idBufSize + serializedSize) {
                reader.jump(-3);
                break;
            }

            const idBuf = reader.readBuffer(idBufSize);
            const serialized = reader.readBuffer(serializedSize);
            const id = idBuf.length === 32 ? idBuf.toString("hex") : idBuf.readBigUInt64BE().toString();
            const data = Blocks.Deserializer.deserialize(serialized);

            yield { ...data, id };
        }
    }
}

// test.only("dump", async () => {
//     const start = Date.now();
//     let count = 0;

//     for await (const block of dumpBlocks("/home/rainydio/blocks.bin", 2, 10 ** 5)) {
//         if (++count % 10 ** 5 === 0) {
//             const ms = Date.now() - start;
//             const rate = (1000 * count) / ms;
//             const seconds = ms / 1000;
//             console.log(`${count / 10 ** 6}M blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
//         }
//     }
// });

test("replay", async () => {
    let lastState = State.StateFactory.createGenesisState() as Interfaces.IState<Interfaces.IBlockHeader>;
    let rounds = await getRoundsBatch(2, 10 ** 4);
    // let rounds = await getRoundsBatch(2, 346945);

    const start = Date.now();
    let count = 0;

    for await (const block of readBlocks("/home/rainydio/blocks.bin")) {
        lastState = State.StateFactory.createNextState(lastState, block);

        if (lastState.incomplete) {
            if (rounds.length === 0) {
                rounds = await getRoundsBatch(lastState.nextBlockRound.no, 10 ** 4);
            }

            lastState.complete({ nextBlockRoundDelegates: rounds.shift() });
        }

        if (++count % 10 ** 5 === 0) {
            const ms = Date.now() - start;
            const rate = (1000 * count) / ms;
            const seconds = ms / 1000;
            console.log(`${count / 10 ** 6}M blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
        }
    }
});
