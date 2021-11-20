/* eslint-disable require-yield */
import "jest-extended";

import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Blocks, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
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

type Range = { from?: number; to?: number };

async function* getBlocks(range?: Range): AsyncIterable<{ id: string; data: Interfaces.IBlockData }> {
    const limit = 50000;

    for (let height = range?.from ?? 2; ; height += limit) {
        const blocksQuery = `
            select
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
            from blocks
            where height >= ${height} ${range?.to ? `and height <= ${range.to}` : ""}
            order by height
            limit ${limit}
        `;

        const blocksResult = await client.query({ text: blocksQuery, rowMode: "array" });
        if (blocksResult.rows.length === 0) break;

        for (const blocksRow of blocksResult.rows) {
            const [
                id,
                version,
                timestamp,
                previousBlock,
                height,
                numberOfTransactions,
                totalAmount,
                totalFee,
                reward,
                payloadLength,
                payloadHash,
                generatorPublicKey,
                blockSignature,
            ] = blocksRow;

            let transactions: Buffer[] = [];

            if (numberOfTransactions !== 0) {
                const transactionsQuery = `select serialized from transactions where block_id = '${id}' order by sequence`;
                const transactionsResult = await client.query({ text: transactionsQuery, rowMode: "array" });
                transactions = transactionsResult.rows.map(([serialized]) => serialized as Buffer);
            }

            const data = {
                version,
                timestamp,
                previousBlock,
                height,
                numberOfTransactions,
                totalAmount: Utils.BigNumber.make(totalAmount),
                totalFee: Utils.BigNumber.make(totalFee),
                reward: Utils.BigNumber.make(reward),
                payloadLength,
                payloadHash,
                generatorPublicKey,
                blockSignature,
                transactions,
            };

            yield { id, data };
        }
    }
}

describe("BlockFactory.createBlockFromBuffer", () => {
    it("should work", async () => {
        await client.connect();

        try {
            const start = Date.now();
            let last = start;
            let n = 0;

            for await (const { id, data } of getBlocks({ from: 2 })) {
                n++;

                const header = { id, ...data };
                const fn = () => Blocks.BlockFactory.createBlockFromSerializedTransactions(header, data.transactions);

                expect(fn).not.toThrow();

                const now = Date.now();
                if (now - last > 1000) {
                    last = now;
                    const rate = (1000 * n) / (now - start);
                    const seconds = (now - start) / 1000;
                    console.log(`${n} blocks in ${seconds.toFixed(1)}s, ${rate.toFixed(0)} blocks/s`);
                }
            }
        } finally {
            await client.end();
        }
    });
});
