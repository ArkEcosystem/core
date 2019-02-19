import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import first from "lodash/first";
import last from "lodash/last";
import { client } from "../services/client";
import { storage } from "../services/storage";
import { Index } from "./index";

import { models } from "@arkecosystem/crypto";
const { Transaction } = models;

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

class TransactionIndex extends Index {
    public async index() {
        const { count } = await this.__count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.__createQuery();

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
            logger.info(
                `[Elasticsearch] Indexing transactions from block ${first(blockIds)} to ${last(
                    blockIds,
                )} :card_index_dividers:`,
            );

            try {
                await client.bulk(this._buildBulkUpsert(rows));

                storage.update({
                    lastTransaction: +last(rows.map(row => row.timestamp)),
                });
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        }
    }

    public listen() {
        this._registerCreateListener("transaction.applied");
        this._registerCreateListener("transaction.forged");

        this._registerDeleteListener("transaction.expired");
        this._registerDeleteListener("transaction.reverted");
    }

    public getIndex() {
        return "transactions";
    }

    public getType() {
        return "transaction";
    }
}

export const transactionIndex = new TransactionIndex();
