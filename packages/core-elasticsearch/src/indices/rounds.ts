import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Rounds extends Index {
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
                .where(modelQuery.round.gte(storage.get("lastRound")))
                .order(modelQuery.round.asc)
                .limit(this.chunkSize);

            const rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                const roundIds = rows.map(row => row.round);
                this.logger.info(`[ES] Indexing ${rows.length} rounds [${first(roundIds)} - ${last(roundIds)}]`);

                try {
                    await client.bulk(this.buildBulkUpsert(rows));

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
