"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const storage_1 = require("../storage");
const utils_1 = require("../utils");
const base_1 = require("./base");
class Rounds extends base_1.Index {
    async index() {
        const iterations = await this.getIterations();
        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();
            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.round.gte(storage_1.storage.get("lastRound")))
                .order(modelQuery.round.asc)
                .limit(this.chunkSize);
            const rows = await this.database.connection.query.manyOrNone(query.toQuery());
            if (rows.length) {
                const rounds = rows.map(row => row.round);
                this.logger.info(`[ES] Indexing ${rows.length} round slots [${utils_1.first(rounds)} - ${utils_1.last(rounds)}]`);
                try {
                    for (const row of rows) {
                        row.id = `${row.height}_${row.publicKey}`;
                    }
                    await this.bulkUpsert(rows);
                    storage_1.storage.update({
                        lastRound: +utils_1.last(rounds),
                    });
                }
                catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }
    listen() {
        this.emitter.on(core_event_emitter_1.ApplicationEvents.RoundCreated, () => this.index());
    }
}
exports.Rounds = Rounds;
//# sourceMappingURL=rounds.js.map