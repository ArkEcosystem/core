import { app, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Blocks, Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";

import { Blockchain } from "../blockchain";
import { FailedToReplayBlocksError } from "./errors";
import { MemoryDatabaseService } from "./memory-database-service";

export class ReplayBlockchain extends Blockchain {
    private logger: Contracts.Kernel.Log.Logger;
    private localDatabase: Contracts.Database.DatabaseService;
    private walletRepository: Wallets.WalletRepository;
    private walletState: Wallets.WalletState; // @todo: review and/or remove
    private targetHeight: number;
    private chunkSize = 20000;

    private memoryDatabase: Contracts.Database.DatabaseService;

    public get database(): Contracts.Database.DatabaseService {
        return this.memoryDatabase;
    }

    public constructor() {
        super({});

        this.walletRepository = new Wallets.WalletRepository();
        this.walletState = app.resolve<Wallets.WalletState>(Wallets.WalletState).init(this.walletRepository);
        this.memoryDatabase = new MemoryDatabaseService(this.walletRepository);

        this.logger = app.log;
        this.localDatabase = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);
        this.localDatabase.walletRepository = this.walletRepository;

        this.queue.kill();
        // @ts-ignore
        this.queue.drain(() => undefined);
    }

    public get p2p(): Contracts.P2P.PeerService {
        return undefined;
    }

    public get transactionPool(): Contracts.TransactionPool.Connection {
        return undefined;
    }

    public resetLastDownloadedBlock(): void {
        return;
    }

    public resetWakeUp(): void {
        return;
    }

    public async replay(targetHeight = -1): Promise<void> {
        this.logger.info("Starting replay...");

        const lastBlock: Interfaces.IBlock = await this.localDatabase.getLastBlock();
        const startHeight = 2;

        if (targetHeight <= startHeight || targetHeight > lastBlock.data.height) {
            targetHeight = lastBlock.data.height;
        }

        this.targetHeight = targetHeight;

        await this.processGenesisBlock();

        const replayBatch = async (batch: number, lastAcceptedHeight = 1): Promise<void> => {
            if (lastAcceptedHeight === targetHeight) {
                this.logger.info("Successfully finished replay to target height.");
                return this.disconnect();
            }

            const blocks: Interfaces.IBlock[] = await this.fetchBatch(startHeight, batch, lastAcceptedHeight);

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

        const offset: number = startHeight + (batch - 1) * this.chunkSize;
        const count: number = Math.min(this.targetHeight - lastAcceptedHeight, this.chunkSize);
        const blocks: Interfaces.IBlockData[] = await this.localDatabase.getBlocks(offset, count);

        return blocks.map((block: Interfaces.IBlockData) => Blocks.BlockFactory.fromData(block));
    }

    private async processGenesisBlock(): Promise<void> {
        const genesisBlock: Interfaces.IBlock = Blocks.BlockFactory.fromJson(
            Managers.configManager.get("genesisBlock"),
        );

        const { transactions }: Interfaces.IBlock = genesisBlock;
        for (const transaction of transactions) {
            if (transaction.type === Enums.TransactionType.Transfer) {
                const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(
                    transaction.data.recipientId,
                );
                recipient.balance = new Utils.BigNumber(transaction.data.amount);
            }
        }

        for (const transaction of transactions) {
            const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                transaction.data.senderPublicKey,
            );
            sender.balance = sender.balance.minus(transaction.data.amount).minus(transaction.data.fee);

            if (transaction.type === Enums.TransactionType.DelegateRegistration) {
                sender.setAttribute("delegate", {
                    username: transaction.data.asset.delegate.username,
                    voteBalance: Utils.BigNumber.ZERO,
                    forgedFees: Utils.BigNumber.ZERO,
                    forgedRewards: Utils.BigNumber.ZERO,
                    producedBlocks: 0,
                    round: 0,
                });
                this.walletRepository.reindex(sender);
            } else if (transaction.type === Enums.TransactionType.Vote) {
                const vote = transaction.data.asset.votes[0];
                sender.setAttribute("vote", vote.slice(1));
            }
        }

        this.walletState.buildVoteBalances();

        this.state.setLastBlock(genesisBlock);

        const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(1);
        const delegates: Contracts.State.Wallet[] = this.walletState.loadActiveDelegateList(roundInfo);

        (this.localDatabase as any).forgingDelegates = await this.localDatabase.getActiveDelegates(
            roundInfo,
            delegates,
        );

        this.logger.info("Finished loading genesis block.");
    }

    private async disconnect(): Promise<void> {
        await this.localDatabase.connection.disconnect();
    }
}
