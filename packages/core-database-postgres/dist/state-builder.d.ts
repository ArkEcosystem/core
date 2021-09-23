import { Database, State } from "@arkecosystem/core-interfaces";
export declare class StateBuilder {
    private readonly connection;
    private readonly walletManager;
    private readonly logger;
    private readonly emitter;
    constructor(connection: Database.IConnection, walletManager: State.IWalletManager);
    run(): Promise<void>;
    private buildBlockRewards;
    private buildSentTransactions;
    private verifyWalletsConsistency;
}
