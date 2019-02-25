import { Database } from "@arkecosystem/core-interfaces";
import { DatabaseService } from "./database-service";
import { DelegatesRepository } from "./repositories/delegates";
import { WalletsRepository } from "./repositories/wallets";

// Allow extenders of core-database to provide, optionally, a IWalletManager concrete in addition to a IDatabaseConnection, but keep the business repos common
export const databaseServiceFactory = async (
    opts: any,
    walletManager: Database.IWalletManager,
    connection: Database.IDatabaseConnection,
): Promise<Database.IDatabaseService> => {
    let databaseService: DatabaseService;
    databaseService = new DatabaseService(
        opts,
        connection,
        walletManager,
        // @ts-ignore
        new WalletsRepository(() => databaseService),
        new DelegatesRepository(() => databaseService),
    );
    await databaseService.init();
    return databaseService;
};
