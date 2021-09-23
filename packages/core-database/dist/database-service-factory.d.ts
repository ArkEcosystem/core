import { Database, State } from "@arkecosystem/core-interfaces";
export declare const databaseServiceFactory: (opts: Record<string, any>, walletManager: State.IWalletManager, connection: Database.IConnection) => Promise<Database.IDatabaseService>;
