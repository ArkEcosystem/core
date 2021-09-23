"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransactionReader {
    constructor(connection, type, typeGroup) {
        this.connection = connection;
        this.type = type;
        this.typeGroup = typeGroup;
        this.bufferSize = 1000000000;
    }
    static async create(connection, typeConstructor) {
        const reader = new TransactionReader(connection, typeConstructor.type, typeConstructor.typeGroup);
        await reader.init();
        return reader;
    }
    hasNext() {
        return this.index < this.count;
    }
    async read() {
        const transactions = await this.connection.transactionsRepository.getAssetsByType(this.type, this.typeGroup, this.bufferSize, this.index);
        this.index += transactions.length;
        return transactions;
    }
    async init() {
        this.index = 0;
        this.count = await this.connection.transactionsRepository.getCountOfType(this.type, this.typeGroup);
    }
}
exports.TransactionReader = TransactionReader;
//# sourceMappingURL=transaction-reader.js.map