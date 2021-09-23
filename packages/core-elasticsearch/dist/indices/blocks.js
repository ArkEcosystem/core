"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const storage_1 = require("../storage");
const utils_1 = require("../utils");
const base_1 = require("./base");
class Blocks extends base_1.Index {
    async index() {
        const iterations = await this.getIterations();
        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();
            const query = modelQuery
                .select()
                .from(modelQuery)
                .where(modelQuery.height.gte(storage_1.storage.get("lastBlock")))
                .order(modelQuery.height.asc)
                .limit(this.chunkSize);
            const rows = await this.database.connection.query.manyOrNone(query.toQuery());
            if (rows.length) {
                const heights = rows.map(row => row.height);
                this.logger.info(`[ES] Indexing ${rows.length} blocks [${utils_1.first(heights)} - ${utils_1.last(heights)}]`);
                try {
                    await this.bulkUpsert(rows);
                    storage_1.storage.update({
                        lastBlock: +utils_1.last(heights),
                    });
                }
                catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }
    listen() {
        this.registerListener("create", core_event_emitter_1.ApplicationEvents.BlockApplied);
        this.registerListener("delete", core_event_emitter_1.ApplicationEvents.BlockReceived);
    }
}
exports.Blocks = Blocks;
//# sourceMappingURL=blocks.js.map