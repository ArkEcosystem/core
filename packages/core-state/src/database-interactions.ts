import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";

import { RoundState } from "./round-state";

@Container.injectable()
export class DatabaseInteraction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    @Container.inject(Container.Identifiers.BlockState)
    @Container.tagged("state", "blockchain")
    private readonly blockState!: Contracts.State.BlockState;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.StateTransactionStore)
    private readonly stateTransactionStore!: Contracts.State.TransactionStore;

    @Container.inject(Container.Identifiers.StateBlockStore)
    private readonly stateBlockStore!: Contracts.State.BlockStore;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "blockchain")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.RoundState)
    private readonly roundState!: RoundState;

    public async initialize(): Promise<void> {
        try {
            this.events.dispatch(Enums.StateEvent.Starting);

            const genesisBlockJson = Managers.configManager.get("genesisBlock");
            const genesisBlock = Blocks.BlockFactory.fromJson(genesisBlockJson);

            this.stateStore.setGenesisBlock(genesisBlock!);

            if (process.env.CORE_RESET_DATABASE) {
                await this.reset();
            }

            await this.initializeLastBlock();
        } catch (error) {
            this.logger.error(error.stack);
            this.app.terminate("Failed to initialize database service.", error);
        }
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        await this.roundState.detectMissedBlocks(block);

        await this.blockState.applyBlock(block);
        await this.roundState.applyBlock(block);

        for (const transaction of block.transactions) {
            await this.emitTransactionEvents(transaction);
        }

        this.events.dispatch(Enums.BlockEvent.Applied, block.data);
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        await this.roundState.revertBlock(block);
        await this.blockState.revertBlock(block);

        for (let i = block.transactions.length - 1; i >= 0; i--) {
            this.events.dispatch(Enums.TransactionEvent.Reverted, block.transactions[i].data);
        }

        this.events.dispatch(Enums.BlockEvent.Reverted, block.data);
    }

    public async restoreCurrentRound(): Promise<void> {
        await this.roundState.restore();
    }

    // TODO: Remove
    public async getActiveDelegates(
        roundInfo?: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<Contracts.State.Wallet[]> {
        return this.roundState.getActiveDelegates(roundInfo, delegates);
    }

    private async reset(): Promise<void> {
        await this.databaseService.reset();
        await this.createGenesisBlock();
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

    private async emitTransactionEvents(transaction: Interfaces.ITransaction): Promise<void> {
        this.events.dispatch(Enums.TransactionEvent.Applied, transaction.data);
        const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
        // ! no reason to pass this.emitter
        handler.emitEvents(transaction, this.events);
    }
}
