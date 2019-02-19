import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

import { models } from "@arkecosystem/crypto";
const { Transaction } = models;

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

export class Transactions extends Index {
    public async index() {
        const { count } = await this.count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select(modelQuery.block_id, modelQuery.serialized)
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage.get("lastTransaction")))
                .order(modelQuery.timestamp.asc)
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            let rows = await (databaseService.connection as any).query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            rows = rows.map(row => {
                const transaction: any = new Transaction(row.serialized.toString("hex"));
                transaction.blockId = row.blockId;

                return transaction;
            });

            const blockIds = rows.map(row => row.blockId);
            logger.info(`[ES] Indexing transactions from block ${first(blockIds)} to ${last(blockIds)}`);

            try {
                await client.bulk(this.buildBulkUpsert(rows));

                storage.update({
                    lastTransaction: +last(rows.map(row => row.timestamp)),
                });
            } catch (error) {
                logger.error(`[ES] ${error.message}`);
            }
        }
    }

    public listen() {
        this.registerCreateListener("transaction.applied");
        this.registerCreateListener("transaction.forged");

        this.registerDeleteListener("transaction.expired");
        this.registerDeleteListener("transaction.reverted");
    }
}
