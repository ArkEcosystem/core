"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blocks_1 = require("./blocks");
const migrations_1 = require("./migrations");
const rounds_1 = require("./rounds");
const transactions_1 = require("./transactions");
exports.repositories = {
    blocks: blocks_1.BlocksRepository,
    migrations: migrations_1.MigrationsRepository,
    rounds: rounds_1.RoundsRepository,
    transactions: transactions_1.TransactionsRepository,
};
//# sourceMappingURL=index.js.map