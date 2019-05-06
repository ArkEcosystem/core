import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Index } from "./base";

export class Wallets extends Index {
    public async index(): Promise<void> {
        const iterations: number = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                this.logger.info(`[ES] Indexing ${rows.length} wallets`);

                try {
                    for (const row of rows) {
                        row.id = row.address;
                    }

                    await this.bulkUpsert(rows);
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen(): void {
        this.emitter.on(ApplicationEvents.RoundApplied, () => this.index());
    }
}
