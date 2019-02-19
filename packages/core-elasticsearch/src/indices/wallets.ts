import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { Index } from "./base";

export class Wallets extends Index {
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
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
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                this.logger.info(`[ES] Indexing ${rows.length} wallets`);

                try {
                    rows.forEach(row => {
                        row.id = row.address;
                    });

                    await client.bulk(this.buildBulkUpsert(rows));
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
