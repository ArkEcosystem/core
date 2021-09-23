"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const base_1 = require("./base");
class Wallets extends base_1.Index {
    async index() {
        const iterations = await this.getIterations();
        for (let i = 0; i < iterations; i++) {
            const offset = this.chunkSize * i;
            const rows = this.database.walletManager
                .allByAddress()
                .slice(offset, offset + this.chunkSize);
            if (rows.length) {
                this.logger.info(`[ES] Indexing ${rows.length} wallets`);
                try {
                    for (const row of rows) {
                        // @ts-ignore
                        row.id = row.address;
                    }
                    await this.bulkUpsert(rows);
                }
                catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }
    listen() {
        this.emitter.on(core_event_emitter_1.ApplicationEvents.RoundApplied, () => this.index());
    }
    async countWithDatabase() {
        return Object.keys(this.database.walletManager.allByAddress()).length;
    }
}
exports.Wallets = Wallets;
//# sourceMappingURL=wallets.js.map