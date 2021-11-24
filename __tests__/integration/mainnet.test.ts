/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/expect-expect */
/* eslint-disable require-yield */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Interfaces, Managers, Networks, State, Transactions, Utils } from "@packages/crypto";
import { IBlockHeader, IState } from "@packages/crypto/dist/interfaces";
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

type Range = { start?: number; end?: number };

async function* getBlocks(
    range?: Range,
): AsyncIterable<{ blockHeader: IBlockHeader; transactions: readonly Buffer[] }> {
    const limit = 50000;

    for (let height = range?.start ?? 2; ; height += limit) {
        const blocksQuery = {
            rowMode: "array",
            text: `
                select
                    id, version, timestamp, previous_block, height, number_of_transactions,
                    total_amount, total_fee, reward, payload_length, payload_hash, generator_public_key,
                    block_signature
                from blocks
                where height >= ${height} ${range?.end ? `and height < ${range.end}` : ""}
                order by height
                limit ${limit}
            `,
        };

        const blocksResult = await client.query(blocksQuery);
        const blockHeaders = blocksResult.rows.map((row) => ({
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

        const transactionsQuery = {
            rowMode: "array",
            text: `select block_height, serialized from transactions where block_id IN ($1) order by block_height, sequence`,
            values: [blockHeaders.map((block) => block.id)],
        };

        const transactionsResult = await client.query(transactionsQuery);
        const transactionsRows = transactionsResult.rows.slice() as [number, Buffer][];

        for (const blockHeader of blockHeaders) {
            const transactions: Buffer[] = [];

            for (const [i, [blockHeight, transaction]] of transactionsRows.entries()) {
                if (blockHeight === blockHeader.height) {
                    transactions.push(transaction);
                }

                if (blockHeight > blockHeader.height) {
                    transactions.splice(0, i);
                    break;
                }
            }

            yield { blockHeader, transactions };
        }
    }
}

async function getRoundDelegates(round: number): Promise<string[]> {
    const query = `select public_key from rounds where round = ${round} order by balance desc, public_key asc`;
    const result = await client.query({ text: query, rowMode: "array" });
    return result.rows.map((row) => row[0]);
}

test("replay", async () => {
    const start = Date.now();
    let last = start;
    let n = 0;

    const genesisBlockJson = Networks.mainnet.genesisBlock as Interfaces.IBlockJson;
    const genesisBlock = Blocks.BlockFactory.createGenesisBlockFromJson(genesisBlockJson);

    let state = State.StateFactory.createGenesisState(genesisBlock) as IState<IBlockHeader>;

    for await (const { blockHeader, transactions } of getBlocks({ start: 2, end: 3 })) {
        n++;

        const block = Blocks.BlockFactory.createBlockFromData({ ...blockHeader, transactions });

        expect(block.id).toBe(blockHeader.id);
        expect(() => {
            state = state.createNextState(block);
        }).not.toThrow();

        if (!state.nextDelegates) {
            const nextRound = State.Rounds.getRound(state.lastBlock.height + 1);
            const delegates = await getRoundDelegates(nextRound);

            expect(() => {
                state.applyRound(delegates);
            }).not.toThrow();
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
