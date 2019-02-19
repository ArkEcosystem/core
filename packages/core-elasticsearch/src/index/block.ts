import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import first from "lodash/first";
import last from "lodash/last";
import { client } from "../services/client";
import { storage } from "../services/storage";
import { Index } from "./index";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

class BlockIndex extends Index {
    public async index() {
        const { count } = await this.__count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.__createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.height.gte(storage.get("lastBlock")))
                .order(modelQuery.height.asc)
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (databaseService.connection as any).query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            const heights = rows.map(row => row.height);
            logger.info(
                `[Elasticsearch] Indexing blocks from height ${first(heights)} to ${last(
                    heights,
                )} :card_index_dividers:`,
            );

            try {
                await client.bulk(this._buildBulkUpsert(rows));

                storage.update({
                    lastBlock: +last(heights),
                });
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        }
    }

    public listen() {
        this._registerCreateListener("block.applied");
        // this._registerCreateListener('block.forged')

        this._registerDeleteListener("block.reverted");
    }

    public getIndex() {
        return "blocks";
    }

    public getType() {
        return "block";
    }
}

export const blockIndex = new BlockIndex();
