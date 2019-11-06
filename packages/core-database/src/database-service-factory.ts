import { Contracts } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";
import { BlocksBusinessRepository } from "./repositories/blocks-business-repository";
import { TransactionsBusinessRepository } from "./repositories/transactions-business-repository";
import { WalletsBusinessRepository } from "./repositories/wallets-business-repository";

// Allow extenders of core-database to provide, optionally, a WalletRepository concrete in addition to a Connection, but keep the business repos common
export const databaseServiceFactory = async (
    app: Contracts.Kernel.Application,
    opts: Record<string, any>,
    walletRepository: Contracts.State.WalletRepository,
    connection: Contracts.Database.Connection,
): Promise<Contracts.Database.DatabaseService> => {
    const databaseService: Contracts.Database.DatabaseService = app.resolve(DatabaseService).make(
        opts,
        connection,
        walletRepository,
        new WalletsBusinessRepository(() => databaseService),
        // @ts-ignore - init exists but not on the contract
        app.resolve<TransactionsBusinessRepository>(TransactionsBusinessRepository).init(() => databaseService),
        new BlocksBusinessRepository(() => databaseService),
    );

    await databaseService.init();

    return databaseService;
};
