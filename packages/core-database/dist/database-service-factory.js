"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_service_1 = require("./database-service");
const blocks_business_repository_1 = require("./repositories/blocks-business-repository");
const transactions_business_repository_1 = require("./repositories/transactions-business-repository");
const wallets_business_repository_1 = require("./repositories/wallets-business-repository");
// Allow extenders of core-database to provide, optionally, a IWalletManager concrete in addition to a IConnection, but keep the business repos common
exports.databaseServiceFactory = async (opts, walletManager, connection) => {
    const databaseService = new database_service_1.DatabaseService(opts, connection, walletManager, new wallets_business_repository_1.WalletsBusinessRepository(() => databaseService), new transactions_business_repository_1.TransactionsBusinessRepository(() => databaseService), new blocks_business_repository_1.BlocksBusinessRepository(() => databaseService));
    await databaseService.init();
    return databaseService;
};
//# sourceMappingURL=database-service-factory.js.map