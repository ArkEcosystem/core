import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Rounds extends Index {
    public async index() {
        const count = await this.count();
        const cycles = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < cycles; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.round.gte(storage.get("lastRound")))
                .order(modelQuery.round.asc)
                .limit(this.chunkSize);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                const roundIds = rows.map(row => row.round);
                this.logger.info(`[ES] Indexing ${rows.length} rounds [${first(roundIds)} - ${last(roundIds)}]`);

                try {
                    await this.bulkUpsert(rows);

                    storage.update({
                        lastRound: +last(roundIds),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        this.emitter.on("round.created", () => this.index());
    }
}
