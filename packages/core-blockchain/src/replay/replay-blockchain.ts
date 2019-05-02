import { app } from "@arkecosystem/core-container";
import { Database, Logger, P2P, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Blocks, Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { BlockProcessorResult } from "../processor";
import { MemoryDatabaseService } from "./memory-database-service";

export class ReplayBlockchain extends Blockchain {
    private walletManager: Wallets.WalletManager;
    private chunkSize: number = 20000;

    private memoryDatabase: Database.IDatabaseService;
    public get database(): Database.IDatabaseService {
        return this.memoryDatabase;
    }

    public constructor() {
        super({});

        this.walletManager = new Wallets.WalletManager();
        this.memoryDatabase = new MemoryDatabaseService(this.walletManager);

        const database = app.resolvePlugin<Database.IDatabaseService>("database");
        database.walletManager = this.walletManager;

        this.queue.kill();
        this.queue.drain = undefined;
    }

    public get p2p(): P2P.IPeerService {
        return undefined;
    }

    public get transactionPool(): TransactionPool.IConnection {
        return undefined;
    }

    public resetLastDownloadedBlock(): void {
        return;
    }

    public resetWakeUp(): void {
        return;
    }

    // TODO: support dynamic start height
    public async replay(startHeight = 1, endHeight: number = -1): Promise<void> {
        const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
        const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        logger.info("Starting replay...");

        const lastBlock: Interfaces.IBlock = await database.getLastBlock();
        let targetHeight = lastBlock.data.height;

        if (endHeight !== -1 && endHeight < lastBlock.data.height) {
            targetHeight = endHeight;
        }

        await this.processGenesisBlock();
        logger.info("Applied geneis block.");

        console.time("REPLAY");
        for (let i = startHeight + 1; i < targetHeight; i += this.chunkSize) {
            console.time("CHUNK");
            const blocks = await database.getBlocks(i, this.chunkSize);
            let activeDelegates: State.IDelegateWallet[] = [];

            for (const blockData of blocks) {
                try {
                    const { height } = blockData;
                    const nextHeight = height === 1 ? 1 : height + 1;
                    const roundInfo = roundCalculator.calculateRound(nextHeight);

                    console.log(`Processing block ${height}...`);

                    const block = Blocks.BlockFactory.fromData(blockData);
                    const result = await this.blockProcessor.process(block);
                    if (result !== BlockProcessorResult.Accepted) {
                        throw new Error("....");
                    }

                    if (roundCalculator.isNewRound(nextHeight)) {
                        console.log(`Starting round ${roundCalculator.calculateRound(nextHeight).round}`);

                        const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
                        activeDelegates = await database.getActiveDelegates(roundInfo, delegates);

                        (database as any).forgingDelegates = activeDelegates;
                    }
                } catch (error) {
                    logger.error(error.stack);
                    throw error;
                }
            }

            console.timeEnd("CHUNK");
        }
        console.timeEnd("REPLAY");
    }

    private async processGenesisBlock(): Promise<void> {
        const genesisBlock = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));
        const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        const { transactions } = genesisBlock;
        for (const transaction of transactions) {
            if (transaction.type === Enums.TransactionTypes.Transfer) {
                const recipient = this.walletManager.findByAddress(transaction.data.recipientId);
                recipient.balance = new Utils.BigNumber(transaction.data.amount);
            }
        }

        for (const transaction of transactions) {
            const sender = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.data.amount).minus(transaction.data.fee);

            if (transaction.type === Enums.TransactionTypes.DelegateRegistration) {
                sender.username = transaction.data.asset.delegate.username;
                this.walletManager.reindex(sender);
            }
        }

        this.state.setLastBlock(genesisBlock);

        // Initialize the very first round
        const roundInfo = roundCalculator.calculateRound(1);
        const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
        const activeDelegates = await database.getActiveDelegates(roundInfo, delegates);
        (database as any).forgingDelegates = activeDelegates;
    }
}
