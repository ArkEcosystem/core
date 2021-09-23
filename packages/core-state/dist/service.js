"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StateService {
    constructor({ blocks, transactions, storage, }) {
        this.blocks = blocks;
        this.transactions = transactions;
        this.storage = storage;
    }
    getBlocks() {
        return this.blocks;
    }
    getTransactions() {
        return this.transactions;
    }
    getStore() {
        return this.storage;
    }
}
exports.StateService = StateService;
//# sourceMappingURL=service.js.map