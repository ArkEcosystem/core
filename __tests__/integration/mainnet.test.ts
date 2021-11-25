/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/expect-expect */
/* eslint-disable require-yield */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Interfaces, Managers, Networks, State, Transactions, Utils } from "@packages/crypto";
import { IBlockHeader, IState } from "@packages/crypto/dist/interfaces";
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

beforeAll(async () => {
    await client.connect();
});

afterAll(async () => {
    await client.end();
});

type Range = {
    readonly start?: number;
    readonly end?: number;
};

type GetBlocksResultRow = {
    readonly header: IBlockHeader;
    readonly transactions: readonly Buffer[];
};

async function* getBlocks(range?: Range): AsyncIterable<GetBlocksResultRow> {
    const headersQueryText = `
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
        LIMIT $3
    `;

    const transactionsQueryText = `
        SELECT block_height, serialized
        FROM transactions
        WHERE block_id = ANY($1::text[])
        ORDER BY block_height, sequence
    `;

    const limit = 50000;
    const start = range.start ?? 2;
    const end = range.end ?? 100 * 10 ** 6;

    for (let height = start; ; height += limit) {
        const headersQuery = { rowMode: "array", values: [height, end, limit], text: headersQueryText };
        const headersResult = await client.query(headersQuery);
        const headers = headersResult.rows.map((row) => ({
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
        })) as IBlockHeader[];

        if (headers.length === 0) {
            break;
        }

        const transactionsQueryValues = [headers.map((blockHeader) => blockHeader.id)];
        const transactionsQuery = { rowMode: "array", values: transactionsQueryValues, text: transactionsQueryText };
        const transactionsResult = await client.query(transactionsQuery);
        const transactionsRows = transactionsResult.rows.slice() as [number, Buffer][];

        for (const header of headers) {
            const transactions: Buffer[] = [];

            for (let i = 0; i < header.numberOfTransactions; i++) {
                const [blockHeight, serialized] = transactionsRows.shift();
                assert(header.height === blockHeight);
                transactions.push(serialized);
            }

            yield { header, transactions };
        }
    }
}

async function getRoundDelegates(round: number): Promise<string[]> {
    const queryText = `SELECT public_key FROM rounds WHERE round = $1 ORDER BY balance desc, public_key asc`;
    const query = { text: queryText, values: [round], rowMode: "array" };
    const result = await client.query(query);

    return result.rows.map((row) => row[0]);
}

test("replay", async () => {
    const start = Date.now();
    let last = start;
    let n = 0;

    const genesisBlockJson = Networks.mainnet.genesisBlock as Interfaces.IBlockJson;
    const genesisBlock = Blocks.BlockFactory.createGenesisBlockFromJson(genesisBlockJson);

    let state = State.StateFactory.createGenesisState(genesisBlock) as IState<IBlockHeader>;

    for await (const { header, transactions } of getBlocks({ start: 2 })) {
        n++;

        // Blocks.Deserializer.deserialize(Blocks.Serializer.serialize({ ...header, transactions }));

        state = state.createNextState(header);

        if (!state.nextDelegates) {
            const nextRound = State.Rounds.getRound(state.lastBlock.height + 1);
            const delegates = await getRoundDelegates(nextRound);

            state.applyRound(delegates);
        }

        const now = Date.now();
        if (now - last > 1000) {
            last = now;
            const rate = (1000 * n) / (now - start);
            const seconds = (now - start) / 1000;
            console.log(`${n} blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
        }
    }
});
