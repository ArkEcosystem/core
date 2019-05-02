import { app } from "@arkecosystem/core-container";
import { Database, Logger, P2P, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Blocks, Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { BlockProcessorResult } from "../processor";
import { MemoryDatabaseService } from "./memory-database-service";

export class ReplayBlockchain extends Blockchain {
    private walletManager: Wallets.WalletManager;

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

    public async replay(startHeight = 1, endHeight: number = -1): Promise<void> {
        const logger = app.resolvePlugin<Logger.ILogger>("logger");
        const database = app.resolvePlugin<Database.IDatabaseService>("database");

        logger.info("Starting replay...");

        const lastBlock = await database.getLastBlock();

        const targetHeight = lastBlock.data.height;
        const chunkSize = 20000;

        console.time("REPLAY");
        for (let i = startHeight || 1; i < targetHeight; i += chunkSize) {
            console.time("CHUNK");
            const blocks = await database.getBlocks(i, chunkSize);
            let activeDelegates: State.IDelegateWallet[] = [];

            for (const blockData of blocks) {
                try {
                    const { height } = blockData;
                    const nextHeight = height === 1 ? 1 : height + 1;
                    const roundInfo = roundCalculator.calculateRound(nextHeight);

                    console.log(`Processing block ${height}...`);

                    if (height === 1) {
                        this.processGenesisBlock(blockData);
                    } else {
                        const block = Blocks.BlockFactory.fromData(blockData);
                        const result = await this.blockProcessor.process(block);
                        if (result !== BlockProcessorResult.Accepted) {
                            throw new Error("....");
                        }

                        //  walletManager.applyBlock(block);
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

    private processGenesisBlock(block: Interfaces.IBlockData): void {
        const { transactions } = block;
        for (const transaction of transactions) {
            if (transaction.type === Enums.TransactionTypes.Transfer) {
                const recipient = this.walletManager.findByAddress(transaction.recipientId);
                recipient.balance = new Utils.BigNumber(transaction.amount);
            }
        }

        for (const transaction of transactions) {
            const sender = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.amount).minus(transaction.fee);

            if (transaction.type === Enums.TransactionTypes.DelegateRegistration) {
                sender.username = transaction.asset.delegate.username;
                this.walletManager.reindex(sender);
            }

            if (sender.balance.isLessThan(0)) {
                //  this.logger.warn(`Negative balance: ${sender}`);
            }
        }

        this.state.setLastBlock(Blocks.BlockFactory.fromData(block));
    }
}
