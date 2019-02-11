import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../services/client";
import { Index } from "./index";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

class WalletIndex extends Index {
    /**
     * Index wallets using the specified chunk size.
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
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (databaseService.connection as any).query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            logger.info(`[Elasticsearch] Indexing ${rows.length} wallets :card_index_dividers:`);

            try {
                rows.forEach(row => {
                    row.id = row.address;
                });

                await client.bulk(this._buildBulkUpsert(rows));
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        }
    }

    /**
     * Register listeners for "wallet.*" events.
     * @return {void}
     */
    public listen() {
        emitter.on("wallets:updated", data => this.index());
    }

    /**
     * Get the document index.
     * @return {String}
     */
    public getIndex() {
        return "wallets";
    }

    /**
     * Get the document type.
     * @return {String}
     */
    public getType() {
        return "wallet";
    }
}

export const walletIndex = new WalletIndex();
