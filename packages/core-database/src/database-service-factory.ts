import { Database } from "@arkecosystem/core-interfaces";
import { DatabaseService } from "./database-service";
import { BlocksBusinessRepository } from "./repositories/blocks-business-repository";
import { DelegatesBusinessRepository } from "./repositories/delegates-business-repository";
import { TransactionsBusinessRepository } from "./repositories/transactions-business-repository";
import { WalletsBusinessRepository } from "./repositories/wallets-business-repository";

// Allow extenders of core-database to provide, optionally, a IWalletManager concrete in addition to a IConnection, but keep the business repos common
export const databaseServiceFactory = async (
    opts: Record<string, any>,
    walletManager: Database.IWalletManager,
    connection: Database.IConnection,
): Promise<Database.IDatabaseService> => {
    let databaseService: DatabaseService;
    databaseService = new DatabaseService(
        opts,
        connection,
        walletManager,
        new WalletsBusinessRepository(() => databaseService),
        new DelegatesBusinessRepository(() => databaseService),
        new TransactionsBusinessRepository(() => databaseService),
        new BlocksBusinessRepository(() => databaseService),
    );
    await databaseService.init();
    return databaseService;
};
