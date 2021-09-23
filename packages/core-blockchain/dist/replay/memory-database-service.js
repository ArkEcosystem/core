"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_database_1 = require("@arkecosystem/core-database");
class MemoryDatabaseService extends core_database_1.DatabaseService {
    constructor(walletManager) {
        super(undefined, undefined, undefined, undefined, undefined, undefined);
        this.walletManager = walletManager;
        this.blocksInCurrentRound = [];
    }
    async saveBlocks(blocks) {
        return;
    }
    async saveRound(activeDelegates) {
        this.logger.info(`Saving round ${activeDelegates[0].getAttribute("delegate.round").toLocaleString()}`);
    }
    async deleteRound(round) {
        return;
    }
    async getForgedTransactionsIds(ids) {
        return [];
    }
    async getBlock(id) {
        return undefined;
    }
}
exports.MemoryDatabaseService = MemoryDatabaseService;
//# sourceMappingURL=memory-database-service.js.map