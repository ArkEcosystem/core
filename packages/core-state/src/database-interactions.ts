import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Enums, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Identities, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import assert from "assert";

@Container.injectable()
export class DatabaseInteraction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    @Container.inject(Container.Identifiers.BlockState)
    @Container.tagged("state", "blockchain")
    private readonly blockState!: Contracts.State.BlockState;

    @Container.inject(Container.Identifiers.DposState)
    @Container.tagged("state", "blockchain")
    private readonly dposState!: Contracts.State.DposState;

    @Container.inject(Container.Identifiers.DposPreviousRoundStateProvider)
    private readonly getDposPreviousRoundState!: Contracts.State.DposPreviousRoundStateProvider;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    // TODO: StateTransactionStore interface
    @Container.inject(Container.Identifiers.StateTransactionStore)
    private readonly stateTransactionStore!: any;

    // TODO: StateBlockStore interface
    @Container.inject(Container.Identifiers.StateBlockStore)
    private readonly stateBlockStore!: any;

    // TODO: TransactionHandlerRegistry interface
    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "blockchain")
    private readonly handlerRegistry!: any;

    // core-state
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.TriggerService)
    private readonly triggers!: Services.Triggers.Triggers;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private blocksInCurrentRound: Interfaces.IBlock[] = [];

    private forgingDelegates: Contracts.State.Wallet[] = [];

    public async initialize(): Promise<void> {
        try {
            this.events.dispatch(Enums.StateEvent.Starting);

            const genesisBlockJson = Managers.configManager.get("genesisBlock");
            const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(
                this.app,
                genesisBlockJson.height,
            );
            const genesisBlock = Blocks.BlockFactory.fromJson(genesisBlockJson, blockTimeLookup);
            this.stateStore.setGenesisBlock(genesisBlock!);

            if (process.env.CORE_RESET_DATABASE) {
                await this.reset();
            }

            await this.initializeLastBlock();
            await this.loadBlocksFromCurrentRound();
        } catch (error) {
            this.logger.error(error.stack);
            this.app.terminate("Failed to initialize database service.", error);
        }
    }

    public async reset(): Promise<void> {
        await this.databaseService.reset();
        await this.createGenesisBlock();
    }

    public async restoreCurrentRound(height: number): Promise<void> {
        await this.initializeActiveDelegates(height);
        await this.applyRound(height);
    }

    // TODO: move out of core-database to get rid of BlockState dependency
    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        await this.blockState.applyBlock(block);

        this.blocksInCurrentRound.push(block);

        await this.detectMissedBlocks(block);

        await this.applyRound(block.data.height);

        for (const transaction of block.transactions) {
            await this.emitTransactionEvents(transaction);
        }

        this.events.dispatch(Enums.BlockEvent.Applied, block.data);
    }

    // TODO: move out of core-database to get rid of WalletState dependency
    public async applyRound(height: number): Promise<void> {
        // ! this doesn't make sense
        // ! next condition should be modified to include height === 1
        const nextHeight: number = height === 1 ? 1 : height + 1;

        if (AppUtils.roundCalculator.isNewRound(nextHeight)) {
            const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(nextHeight);
            const { round } = roundInfo;

            if (
                nextHeight === 1 ||
                this.forgingDelegates.length === 0 ||
                this.forgingDelegates[0].getAttribute<number>("delegate.round") !== round
            ) {
                this.logger.info(`Starting Round ${roundInfo.round.toLocaleString()}`);

                try {
                    if (nextHeight > 1) {
                        this.detectMissedRound(this.forgingDelegates);
                    }

                    this.dposState.buildDelegateRanking();
                    this.dposState.setDelegatesRound(roundInfo);

                    await this.setForgingDelegatesOfRound(roundInfo, this.dposState.getRoundDelegates().slice());
                    await this.databaseService.saveRound(this.dposState.getRoundDelegates());

                    this.blocksInCurrentRound = [];

                    this.events.dispatch(Enums.RoundEvent.Applied);
                } catch (error) {
                    // trying to leave database state has it was
                    // ! this.saveRound may not have been called
                    // ! try should be moved below await this.setForgingDelegatesOfRound
                    await this.databaseService.deleteRound(round);

                    throw error;
                }
            } else {
                // ! then applyRound should not be called at all
                this.logger.warning(
                    `Round ${round.toLocaleString()} has already been applied. This should happen only if you are a forger.`,
                );
            }
        }
    }

    public async revertRound(height: number): Promise<void> {
        const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(height);
        const { round, nextRound, maxDelegates } = roundInfo;

        // ! height >= maxDelegates is always true
        if (nextRound === round + 1 && height >= maxDelegates) {
            this.logger.info(`Back to previous round: ${round.toLocaleString()}`);

            this.blocksInCurrentRound = await this.getBlocksForRound(roundInfo);

            await this.setForgingDelegatesOfRound(
                roundInfo,
                await this.calcPreviousActiveDelegates(roundInfo, this.blocksInCurrentRound),
            );

            // ! this will only delete one round
            await this.databaseService.deleteRound(nextRound);
        }
    }

    public async loadBlocksFromCurrentRound(): Promise<void> {
        // ! this should not be public, this.blocksInCurrentRound is used by DatabaseService only
        this.blocksInCurrentRound = await this.getBlocksForRound();
    }

    // TODO: move out of core-database to get rid of BlockState dependency
    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        await this.revertRound(block.data.height);
        await this.blockState.revertBlock(block);

        // ! blockState is already reverted if this check fails
        assert(this.blocksInCurrentRound.pop()!.data.id === block.data.id);

        for (let i = block.transactions.length - 1; i >= 0; i--) {
            this.events.dispatch(Enums.TransactionEvent.Reverted, block.transactions[i].data);
        }

        this.events.dispatch(Enums.BlockEvent.Reverted, block.data);
    }

    public async getBlocksForRound(roundInfo?: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock[]> {
        // ! it should check roundInfo before assuming that lastBlock is what's have to be returned

        let lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

        if (!lastBlock) {
            lastBlock = await this.databaseService.getLastBlock();
        }

        if (!lastBlock) {
            return [];
        } else if (lastBlock.data.height === 1) {
            return [lastBlock];
        }

        if (!roundInfo) {
            roundInfo = AppUtils.roundCalculator.calculateRound(lastBlock.data.height);
        }

        // ? number of blocks in round may not equal roundInfo.maxDelegates
        // ? see round-calculator.ts handling milestone change
        const blocks = await this.databaseService.getBlocks(roundInfo.roundHeight, roundInfo.maxDelegates);

        const builtBlockPromises: Promise<Interfaces.IBlock>[] = blocks.map(async (block: Interfaces.IBlockData) => {
            if (block.height === 1) {
                return this.stateStore.getGenesisBlock();
            }

            const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(this.app, block.height);
            return Blocks.BlockFactory.fromData(block, blockTimeLookup, { deserializeTransactionsUnchecked: true })!;
        });

        return Promise.all(builtBlockPromises);
    }

    public async getActiveDelegates(
        roundInfo?: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<Contracts.State.Wallet[]> {
        if (!roundInfo) {
            // ! use this.stateStore.getLastBlock()
            const lastBlock = await this.databaseService.getLastBlock();
            roundInfo = AppUtils.roundCalculator.calculateRound(lastBlock.data.height);
        }

        const { round } = roundInfo;

        if (this.forgingDelegates.length && this.forgingDelegates[0].getAttribute<number>("delegate.round") === round) {
            return this.forgingDelegates;
        }

        // When called during applyRound we already know the delegates, so we don't have to query the database.
        if (!delegates) {
            delegates = (await this.databaseService.getRound(round)).map(({ publicKey, balance }) => {
                // ! find wallet by public key and clone it
                const wallet = this.walletRepository.createWallet(Identities.Address.fromPublicKey(publicKey));
                wallet.publicKey = publicKey;
                wallet.setAttribute("delegate", {
                    voteBalance: Utils.BigNumber.make(balance),
                    username: this.walletRepository.findByPublicKey(publicKey).getAttribute("delegate.username", ""), // ! default username?
                });
                return wallet;
            });
        }

        for (const delegate of delegates) {
            // ! throw if delegate round doesn't match instead of altering argument
            delegate.setAttribute("delegate.round", round);
        }

        // ! extracting code below can simplify many call stacks and tests

        const seedSource: string = round.toString();
        let currentSeed: Buffer = Crypto.HashAlgorithms.sha256(seedSource);

        delegates = delegates.map((delegate) => delegate.clone());
        for (let i = 0, delCount = delegates.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = delegates[newIndex];
                delegates[newIndex] = delegates[i];
                delegates[i] = b;
            }
            currentSeed = Crypto.HashAlgorithms.sha256(currentSeed);
        }

        return delegates;
    }

    public async verifyBlockchain(): Promise<boolean> {
        const lastBlock = this.stateStore.getLastBlock();
        return this.databaseService.verifyBlockchain(lastBlock);
    }

    public async getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]> {
        let commonBlocks: Interfaces.IBlockData[] = this.stateStore.getCommonBlocks(ids);

        if (commonBlocks.length < ids.length) {
            // ! do not query blocks that were found
            // ! why method is called commonBlocks, but is just findByIds?
            commonBlocks = ((await this.databaseService.findBlockByID(ids)) as unknown) as Interfaces.IBlockData[];
        }

        return commonBlocks;
    }

    public async getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]> {
        // The functions below return matches in the range [start, end], including both ends.
        const start: number = offset;
        const end: number = offset + limit - 1;

        let blocks: Interfaces.IBlockData[] = this.stateStore.getLastBlocksByHeight(start, end, headersOnly);

        if (blocks.length !== limit) {
            // ! assumes that earlier blocks may be missing
            // ! but querying database is unnecessary when later blocks are missing too (aren't forged yet)
            blocks = await this.databaseService.getBlocks(start, end, headersOnly);
        }

        return blocks;
    }

    public async getRecentBlockIds(): Promise<string[]> {
        // ! why getLastBlockIds returns blocks and not ids?
        let blocks: any[] = this.stateStore.getLastBlockIds().reverse().slice(0, 10);

        if (blocks.length < 10) {
            // ! blockRepository.findRecent returns objects containing single id property in reverse order
            // ! where recent block id is first in array
            blocks = await this.databaseService.findRecentBlocks(10);
        }

        return blocks.map((block) => block.id);
    }

    /**
     * Get the blocks at the given heights.
     * The transactions for those blocks will not be loaded like in `getBlocks()`.
     * @param {Array} heights array of arbitrary block heights
     * @return {Array} array for the corresponding blocks. The element (block) at index `i`
     * in the resulting array corresponds to the requested height at index `i` in the input
     * array heights[]. For example, if
     * heights[0] = 100
     * heights[1] = 200
     * heights[2] = 150
     * then the result array will have the same number of elements (3) and will be:
     * result[0] = block at height 100
     * result[1] = block at height 200
     * result[2] = block at height 150
     * If some of the requested blocks do not exist in our chain (requested height is larger than
     * the height of our blockchain), then that element will be `undefined` in the resulting array
     * @throws Error
     */
    public async getBlocksByHeight(heights: number[]) {
        // TODO: add type
        const blocks: Interfaces.IBlockData[] = [];

        // Map of height -> index in heights[], e.g. if
        // heights[5] == 6000000, then
        // toGetFromDB[6000000] == 5
        // In this map we only store a subset of the heights - the ones we could not retrieve
        // from app/state and need to get from the database.
        const toGetFromDB = {};

        for (const [i, height] of heights.entries()) {
            const stateBlocks = this.stateStore.getLastBlocksByHeight(height, height, true);

            if (Array.isArray(stateBlocks) && stateBlocks.length > 0) {
                blocks[i] = stateBlocks[0];
            }

            if (blocks[i] === undefined) {
                toGetFromDB[height] = i;
            }
        }

        const heightsToGetFromDB: number[] = Object.keys(toGetFromDB).map((height) => +height);
        if (heightsToGetFromDB.length > 0) {
            const blocksByHeights = await this.databaseService.findBlockByHeights(heightsToGetFromDB);

            for (const blockFromDB of blocksByHeights) {
                const index = toGetFromDB[blockFromDB.height];
                blocks[index] = blockFromDB;
            }
        }

        return blocks;
    }

    private async detectMissedBlocks(block: Interfaces.IBlock) {
        const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

        if (lastBlock.data.height === 1) {
            return;
        }

        const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(
            this.app,
            lastBlock.data.height,
        );

        const lastSlot: number = Crypto.Slots.getSlotNumber(blockTimeLookup, lastBlock.data.timestamp);
        const currentSlot: number = Crypto.Slots.getSlotNumber(blockTimeLookup, block.data.timestamp);

        const missedSlots: number = Math.min(currentSlot - lastSlot - 1, this.forgingDelegates.length);
        for (let i = 0; i < missedSlots; i++) {
            const missedSlot: number = lastSlot + i + 1;
            const delegate: Contracts.State.Wallet = this.forgingDelegates[missedSlot % this.forgingDelegates.length];

            this.logger.debug(
                `Delegate ${delegate.getAttribute("delegate.username")} (${delegate.publicKey}) just missed a block.`,
            );

            this.events.dispatch(Enums.ForgerEvent.Missing, {
                delegate,
            });
        }
    }

    private async initializeLastBlock(): Promise<void> {
        // ? attempt to remove potentially corrupt blocks from database

        let lastBlock: Interfaces.IBlock | undefined;
        let tries = 5; // ! actually 6, but only 5 will be removed

        // Ensure the config manager is initialized, before attempting to call `fromData`
        // which otherwise uses potentially wrong milestones.
        let lastHeight: number = 1;
        const latest: Interfaces.IBlockData | undefined = await this.databaseService.findLatestBlock();
        if (latest) {
            lastHeight = latest.height;
        }

        Managers.configManager.setHeight(lastHeight);

        const getLastBlock = async (): Promise<Interfaces.IBlock | undefined> => {
            try {
                return await this.databaseService.getLastBlock();
            } catch (error) {
                this.logger.error(error.message);

                if (tries > 0) {
                    const block: Interfaces.IBlockData = (await this.databaseService.findLatestBlock())!;
                    await this.databaseService.deleteBlocks([block]);
                    tries--;
                } else {
                    this.app.terminate("Unable to deserialize last block from database.", error);
                    throw new Error("Terminated (unreachable)");
                }

                return getLastBlock();
            }
        };

        lastBlock = await getLastBlock();

        if (!lastBlock) {
            this.logger.warning("No block found in database");
            lastBlock = await this.createGenesisBlock();
        }

        this.configureState(lastBlock);
    }

    // TODO: not exactly sure where this goes...
    private async createGenesisBlock(): Promise<Interfaces.IBlock> {
        const genesisBlock = this.stateStore.getGenesisBlock();
        await this.databaseService.saveBlocks([genesisBlock]);
        return genesisBlock;
    }

    private configureState(lastBlock: Interfaces.IBlock): void {
        this.stateStore.setLastBlock(lastBlock);
        const { blocktime, block } = Managers.configManager.getMilestone();
        const blocksPerDay: number = Math.ceil(86400 / blocktime);
        this.stateBlockStore.resize(blocksPerDay);
        this.stateTransactionStore.resize(blocksPerDay * block.maxTransactions);
    }

    private detectMissedRound(delegates: Contracts.State.Wallet[]): void {
        if (!delegates || !this.blocksInCurrentRound.length) {
            // ! this.blocksInCurrentRound is impossible
            // ! otherwise this.blocksInCurrentRound!.length = 0 in applyRound will throw
            return;
        }

        if (this.blocksInCurrentRound.length === 1 && this.blocksInCurrentRound[0].data.height === 1) {
            // ? why skip missed round checks when first round has genesis block only?
            return;
        }

        for (const delegate of delegates) {
            // ! use .some() instead of .fitler()
            const producedBlocks: Interfaces.IBlock[] = this.blocksInCurrentRound.filter(
                (blockGenerator) => blockGenerator.data.generatorPublicKey === delegate.publicKey,
            );

            if (producedBlocks.length === 0) {
                const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(delegate.publicKey!);

                this.logger.debug(
                    `Delegate ${wallet.getAttribute("delegate.username")} (${wallet.publicKey}) just missed a round.`,
                );

                this.events.dispatch(Enums.RoundEvent.Missed, {
                    delegate: wallet,
                });
            }
        }
    }

    private async initializeActiveDelegates(height: number): Promise<void> {
        // ! may be set to undefined to early if error is raised
        this.forgingDelegates = [];

        const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(height);
        await this.setForgingDelegatesOfRound(roundInfo);
    }

    private async setForgingDelegatesOfRound(
        roundInfo: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<void> {
        // ! it's this.getActiveDelegates(roundInfo, delegates);
        // ! only last part of that function which reshuffles delegates is used
        const result = await this.triggers.call("getActiveDelegates", { roundInfo, delegates });
        this.forgingDelegates = (result as Contracts.State.Wallet[]) || [];
    }

    private async calcPreviousActiveDelegates(
        roundInfo: Contracts.Shared.RoundInfo,
        blocks?: Interfaces.IBlock[],
    ): Promise<Contracts.State.Wallet[]> {
        // ! make blocks required parameter forcing caller to specify blocks explicitly
        blocks = blocks || (await this.getBlocksForRound(roundInfo));

        const prevRoundState = await this.getDposPreviousRoundState(blocks, roundInfo);
        for (const prevRoundDelegateWallet of prevRoundState.getAllDelegates()) {
            // ! name suggest that this is pure function
            // ! when in fact it is manipulating current wallet repository setting delegate ranks
            const username = prevRoundDelegateWallet.getAttribute("delegate.username");
            const delegateWallet = this.walletRepository.findByUsername(username);
            delegateWallet.setAttribute("delegate.rank", prevRoundDelegateWallet.getAttribute("delegate.rank"));
        }

        // ! return readonly array instead of taking slice
        return prevRoundState.getRoundDelegates().slice();
    }

    private async emitTransactionEvents(transaction: Interfaces.ITransaction): Promise<void> {
        this.events.dispatch(Enums.TransactionEvent.Applied, transaction.data);
        const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
        // ! no reason to pass this.emitter
        handler.emitEvents(transaction, this.events);
    }
}
