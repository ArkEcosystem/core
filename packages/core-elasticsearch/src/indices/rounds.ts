import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

export class Rounds extends Index {
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
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (databaseService.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                const roundIds = rows.map(row => row.round);
                logger.info(`[ES] Indexing ${rows.length} rounds [${first(roundIds)} - ${last(roundIds)}]`);

                try {
                    await client.bulk(this.buildBulkUpsert(rows));

                    storage.update({
                        lastRound: +last(roundIds),
                    });
                } catch (error) {
                    logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        emitter.on("round.created", () => this.index());
    }
}
