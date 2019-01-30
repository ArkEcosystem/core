import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app, Contracts } from "@arkecosystem/core-kernel";
import first from "lodash/first";
import last from "lodash/last";
import { client } from "../services/client";
import { storage } from "../services/storage";
import { Index } from "./index";

const emitter = app.resolve<Contracts.EventEmitter.EventEmitter>("event-emitter");
const database = app.resolve<PostgresConnection>("database");

class BlockIndex extends Index {
    /**
     * Index blocks using the specified chunk size.
     * @return {void}
     */
    public async index() {
        const { count } = await this.__count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.__createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage.get("history", "lastBlock")))
                .order(modelQuery.height.asc)
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await database.query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            const heights = rows.map(row => row.height);
            app.logger.info(
                `[Elasticsearch] Indexing blocks from height ${first(heights)} to ${last(
                    heights,
                )} :card_index_dividers:`,
            );

            try {
                await client.bulk(this._buildBulkUpsert(rows));

                storage.update("history", {
                    lastBlock: last(heights),
                });
            } catch (error) {
                app.logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        }
    }

    /**
     * Register listeners for "block.*" events.
     * @return {void}
     */
    public listen() {
        this._registerCreateListener("block.applied");
        // this._registerCreateListener('block.forged')

        this._registerDeleteListener("block.reverted");
    }

    /**
     * Get the document index.
     * @return {String}
     */
    public getIndex() {
        return "blocks";
    }

    /**
     * Get the document type.
     * @return {String}
     */
    public getType() {
        return "block";
    }
}

export const blockIndex = new BlockIndex();
