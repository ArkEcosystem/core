import { client } from "../client";
import { Index } from "./base";

export class Wallets extends Index {
    public async index() {
        const cycles = await this.getCycles();

        for (let i = 0; i < cycles; i++) {
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
                    rows.forEach(row => {
                        row.id = row.address;
                    });

                    await this.bulkUpsert(rows);
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        this.emitter.on("round.applied", () => this.index());
    }
}
