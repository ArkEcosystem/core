import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Blocks extends Index {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    public async index() {
        const { count } = await this.count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.height.gte(storage.get("lastBlock")))
                .order(modelQuery.height.asc)
                .limit(this.chunkSize);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                const heights = rows.map(row => row.height);
                this.logger.info(`[ES] Indexing ${rows.length} blocks [${first(heights)} - ${last(heights)}]`);

                try {
                    await client.bulk(this.buildBulkUpsert(rows));

                    storage.update({
                        lastBlock: +last(heights),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        this.registerCreateListener("block.applied");
        this.registerDeleteListener("block.reverted");
    }
}
