import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app, Contracts } from "@arkecosystem/core-kernel";
import { client } from "../services/client";
import { Index } from "./index";

const emitter = app.resolve<Contracts.EventEmitter.EventEmitter>("event-emitter");
const database = app.resolve<PostgresConnection>("database");

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

            const rows = await database.query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            app.logger.info(`[Elasticsearch] Indexing ${rows.length} wallets :card_index_dividers:`);

            try {
                rows.forEach(row => {
                    row.id = row.address;
                });

                await client.bulk(this._buildBulkUpsert(rows));
            } catch (error) {
                app.logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
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
