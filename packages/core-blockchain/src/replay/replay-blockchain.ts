import { app } from "@arkecosystem/core-container";
import { Database, Logger, P2P, Shared, State, TransactionPool } from "@arkecosystem/core-interfaces";
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
        // @ts-ignore
        this.queue.drain(() => undefined);
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
        const startHeight: number = 2;

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

            const blocks: Interfaces.IBlockData[] = await this.fetchBatch(startHeight, batch, lastAcceptedHeight);

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
    ): Promise<Interfaces.IBlockData[]> {
        this.logger.info("Fetching blocks from database...");

        const offset: number = startHeight + (batch - 1) * this.chunkSize;
        const count: number = Math.min(this.targetHeight - lastAcceptedHeight, this.chunkSize);
        const blocks: Interfaces.IBlockData[] = await this.localDatabase.getBlocks(offset, count);

        return blocks;
    }

    private async processGenesisBlock(): Promise<void> {
        Managers.configManager.setHeight(1);

        const genesisBlock: Interfaces.IBlock = Blocks.BlockFactory.fromJson(
            Managers.configManager.get("genesisBlock"),
        );

        const { transactions }: Interfaces.IBlock = genesisBlock;
        for (const transaction of transactions) {
            if (
                transaction.type === Enums.TransactionType.Transfer &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core
            ) {
                const recipient: State.IWallet = this.walletManager.findByAddress(transaction.data.recipientId);
                recipient.balance = new Utils.BigNumber(transaction.data.amount);
            }
        }

        for (const transaction of transactions) {
            const sender: State.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.data.amount).minus(transaction.data.fee);

            if (transaction.typeGroup === Enums.TransactionTypeGroup.Core) {
                if (transaction.type === Enums.TransactionType.DelegateRegistration) {
                    sender.setAttribute("delegate", {
                        username: transaction.data.asset.delegate.username,
                        voteBalance: Utils.BigNumber.ZERO,
                        forgedFees: Utils.BigNumber.ZERO,
                        forgedRewards: Utils.BigNumber.ZERO,
                        producedBlocks: 0,
                        round: 0,
                    });
                    this.walletManager.reindex(sender);
                } else if (transaction.type === Enums.TransactionType.Vote) {
                    const vote = transaction.data.asset.votes[0];
                    sender.setAttribute("vote", vote.slice(1));
                }
            }
        }

        this.walletManager.buildVoteBalances();

        this.state.setLastBlock(genesisBlock);

        const roundInfo: Shared.IRoundInfo = roundCalculator.calculateRound(1);
        const delegates: State.IWallet[] = this.walletManager.loadActiveDelegateList(roundInfo);

        (this.localDatabase as any).forgingDelegates = await this.localDatabase.getActiveDelegates(
            roundInfo,
            delegates,
        );

        this.memoryDatabase.restoreCurrentRound(1);

        this.logger.info("Finished loading genesis block.");
    }

    private async disconnect(): Promise<void> {
        await this.localDatabase.connection.disconnect();
    }
}
