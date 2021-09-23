"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const storage_1 = require("../storage");
const utils_1 = require("../utils");
const base_1 = require("./base");
class Transactions extends base_1.Index {
    async index() {
        const iterations = await this.getIterations();
        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();
            const query = modelQuery
                .select(modelQuery.id, modelQuery.block_id, modelQuery.serialized)
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage_1.storage.get("lastTransaction")))
                .order(modelQuery.timestamp.asc)
                .limit(this.chunkSize);
            let rows = await this.database.connection.query.manyOrNone(query.toQuery());
            if (rows.length) {
                rows = rows.map(row => {
                    const { data } = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(row.serialized, row.id);
                    data.blockId = row.blockId;
                    return data;
                });
                const timestamps = rows.map(row => row.timestamp);
                this.logger.info(`[ES] Indexing ${rows.length} transactions [${utils_1.first(timestamps)} to ${utils_1.last(timestamps)}]`);
                try {
                    await this.bulkUpsert(rows);
                    storage_1.storage.update({
                        lastTransaction: +utils_1.last(timestamps),
                    });
                }
                catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }
    listen() {
        this.registerListener("create", core_event_emitter_1.ApplicationEvents.TransactionApplied);
        this.registerListener("delete", core_event_emitter_1.ApplicationEvents.TransactionExpired);
        this.registerListener("delete", core_event_emitter_1.ApplicationEvents.TransactionReverted);
    }
}
exports.Transactions = Transactions;
//# sourceMappingURL=transactions.js.map