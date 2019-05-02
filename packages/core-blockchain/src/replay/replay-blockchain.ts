import { app } from "@arkecosystem/core-container";
import { Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Blocks, Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { FailedToReplayBlocksError } from "./errors";
import { MemoryDatabaseService } from "./memory-database-service";

export class ReplayBlockchain extends Blockchain {
    private logger: Logger.ILogger;
    private localDatabase: Database.IDatabaseService;
    private walletManager: Wallets.WalletManager;
    private targetHeight: number;
    private chunkSize: number = 20000;

    private memoryDatabase: Database.IDatabaseService;
    public get database(): Database.IDatabaseService {
        return this.memoryDatabase;
    }

    public constructor() {
        super({});

        this.walletManager = new Wallets.WalletManager();
        this.memoryDatabase = new MemoryDatabaseService(this.walletManager);

        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
        this.localDatabase = app.resolvePlugin<Database.IDatabaseService>("database");
        this.localDatabase.walletManager = this.walletManager;

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

    public async replay(targetHeight: number = -1): Promise<void> {
        this.logger.info("Starting replay...");
        const lastBlock: Interfaces.IBlock = await this.localDatabase.getLastBlock();
        const startHeight = 2;

        if (targetHeight <= startHeight || targetHeight > lastBlock.data.height) {
            targetHeight = lastBlock.data.height;
        }

        this.targetHeight = targetHeight;

        await this.processGenesisBlock();

        const replayBatch = async (batch: number, lastAcceptedHeight: number = 1): Promise<void> => {
            if (lastAcceptedHeight === targetHeight) {
                this.logger.info("Successfully finished replay to target height.");
                return this.disconnect();
            }

            const blocks = await this.fetchBatch(startHeight, batch, lastAcceptedHeight);
            this.processBlocks(blocks, async (acceptedBlocks: Interfaces.IBlock[]) => {
                if (acceptedBlocks.length !== blocks.length) {
                    throw new FailedToReplayBlocksError();
                }

                await replayBatch(batch + 1, acceptedBlocks[acceptedBlocks.length - 1].data.height);
            });
        };

        await replayBatch(1);
    }

    private async fetchBatch(
        startHeight: number,
        batch: number,
        lastAcceptedHeight: number,
    ): Promise<Interfaces.IBlock[]> {
        this.logger.info("Fetching blocks from database...");

        const offset = startHeight + (batch - 1) * this.chunkSize;
        const count = Math.min(this.targetHeight - lastAcceptedHeight, this.chunkSize);
        const blocks = await this.localDatabase.getBlocks(offset, count);

        return blocks.map((block: Interfaces.IBlockData) => Blocks.BlockFactory.fromData(block));
    }

    private async processGenesisBlock(): Promise<void> {
        const genesisBlock = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));

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

        const roundInfo = roundCalculator.calculateRound(1);
        const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
        const activeDelegates = await this.localDatabase.getActiveDelegates(roundInfo, delegates);
        (this.localDatabase as any).forgingDelegates = activeDelegates;

        this.logger.info("Finished loading genesis block.");
    }

    private async disconnect(): Promise<void> {
        await this.localDatabase.connection.disconnect();
    }
}
