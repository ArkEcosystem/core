import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Blocks extends Index {
    public async index() {
        const iterations = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
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
                    await this.bulkUpsert(rows);

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
        this.registerListener("create", "block.applied");
        this.registerListener("delete", "block.reverted");
    }
}
