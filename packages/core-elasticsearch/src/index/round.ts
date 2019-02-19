import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import first from "lodash/first";
import last from "lodash/last";
import { client } from "../services/client";
import { storage } from "../services/storage";
import { Index } from "./index";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

class RoundIndex extends Index {
    public async index() {
        const { count } = await this.__count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.__createQuery();

            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.round.gte(storage.get("lastRound")))
                .order(modelQuery.round.asc)
                .limit(this.chunkSize)
                .offset(this.chunkSize * i);

            const rows = await (databaseService.connection as any).query.manyOrNone(query.toQuery());

            if (!rows.length) {
                continue;
            }

            const roundIds = rows.map(row => row.round);
            logger.info(
                `[Elasticsearch] Indexing rounds from ${first(roundIds)} to ${last(roundIds)} :card_index_dividers:`,
            );

            try {
                await client.bulk(this._buildBulkUpsert(rows));

                storage.update({
                    lastRound: +last(roundIds),
                });
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        }
    }

    public listen() {
        emitter.on("round.created", () => this.index());
    }

    public getIndex() {
        return "rounds";
    }

    public getType() {
        return "round";
    }
}

export const roundIndex = new RoundIndex();
