import { Contracts } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";
import { BlocksBusinessRepository } from "./repositories/blocks-business-repository";
import { DelegatesBusinessRepository } from "./repositories/delegates-business-repository";
import { TransactionsBusinessRepository } from "./repositories/transactions-business-repository";
import { WalletsBusinessRepository } from "./repositories/wallets-business-repository";

// Allow extenders of core-database to provide, optionally, a WalletManager concrete in addition to a Connection, but keep the business repos common
export const databaseServiceFactory = async (
    opts: Record<string, any>,
    walletManager: Contracts.State.WalletManager,
    connection: Contracts.Database.Connection,
): Promise<Contracts.Database.DatabaseService> => {
    const databaseService: Contracts.Database.DatabaseService = new DatabaseService(
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
