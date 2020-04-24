import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Rounds extends Index {
    public async index(): Promise<void> {
        const iterations: number = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.round.gte(storage.get("lastRound")))
                .order(modelQuery.round.asc)
                .limit(this.chunkSize);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                const rounds = rows.map(row => row.round);
                this.logger.info(`[ES] Indexing ${rows.length} round slots [${first(rounds)} - ${last(rounds)}]`);

                try {
                    for (const row of rows) {
                        row.id = `${row.height}_${row.publicKey}`;
                    }

                    await this.bulkUpsert(rows);

                    storage.update({
                        lastRound: +last(rounds),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen(): void {
        this.emitter.on(ApplicationEvents.RoundCreated, () => this.index());
    }
}
