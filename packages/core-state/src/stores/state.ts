import { Container, Contracts, Enums, Providers, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";
import assert from "assert";
import { OrderedMap, OrderedSet, Seq } from "immutable";

// todo: extract block and transaction behaviours into their respective stores
// todo: review the implementation
@Container.injectable()
export class StateStore implements Contracts.State.StateStore {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-state")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    // @todo: make all properties private and expose them one-by-one through a getter if used outside of this class
    public blockchain: any = {};
    public genesisBlock: Interfaces.IBlock | undefined = undefined;
    public lastDownloadedBlock: Interfaces.IBlockData | undefined = undefined;
    public blockPing: any = undefined;
    public started = false;
    public forkedBlock: Interfaces.IBlock | undefined = undefined;
    public wakeUpTimeout: any = undefined;
    public noBlockCounter = 0;
    public p2pUpdateCounter = 0;
    public numberOfBlocksToRollback: number | undefined = undefined;
    public networkStart = false;

    // Stores the last n blocks in ascending height. The amount of last blocks
    // can be configured with the option `state.maxLastBlocks`.
    private lastBlocks: OrderedMap<number, Interfaces.IBlock> = OrderedMap<number, Interfaces.IBlock>();
    // Stores the last n incoming transaction ids. The amount of transaction ids
    // can be configred with the option `state.maxLastTransactionIds`.
    private cachedTransactionIds: OrderedSet<string> = OrderedSet();

    /**
     * Resets the state.
     * @todo: remove the need for this method.
     */
    public reset(blockchainMachine): void {
        this.blockchain = blockchainMachine.initialState;
    }

    /**
     * Clear last blocks.
     */
    public clear(): void {
        this.lastBlocks = this.lastBlocks.clear();
        this.cachedTransactionIds = this.cachedTransactionIds.clear();
    }

    /**
     * Clear check later timeout.
     */
    public clearWakeUpTimeout(): void {
        if (this.wakeUpTimeout) {
            clearTimeout(this.wakeUpTimeout);
            this.wakeUpTimeout = undefined;
        }
    }

    /**
     * Get the last block height.
     */
    public getLastHeight(): number {
        return this.getLastBlock().data.height;
    }

    /**
     * Get the genesis block.
     */
    public getGenesisBlock(): Interfaces.IBlock {
        Utils.assert.defined<Interfaces.IBlock>(this.genesisBlock);

        return this.genesisBlock;
    }

    /**
     * Sets the genesis block.
     */
    public setGenesisBlock(block: Interfaces.IBlock): void {
        this.genesisBlock = block;
    }

    /**
     * Get the last block.
     */
    public getLastBlock(): Interfaces.IBlock {
        const lastBlock: Interfaces.IBlock | undefined = this.lastBlocks.last();

        Utils.assert.defined<Interfaces.IBlock>(lastBlock);

        return lastBlock;
    }

    /**
     * Sets the last block.
     */
    public setLastBlock(block: Interfaces.IBlock): void {
        // Only keep blocks which are below the new block height (i.e. rollback)
        if (this.lastBlocks.last() && this.lastBlocks.last<Interfaces.IBlock>().data.height !== block.data.height - 1) {
            assert(block.data.height - 1 <= this.lastBlocks.last<Interfaces.IBlock>().data.height);
            this.lastBlocks = this.lastBlocks.filter((b) => b.data.height < block.data.height);
        }

        this.lastBlocks = this.lastBlocks.set(block.data.height, block);

        Managers.configManager.setHeight(block.data.height);

        if (Managers.configManager.isNewMilestone()) {
            this.logger.notice("Milestone change");
            this.app
                .get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService)
                .dispatch(Enums.CryptoEvent.MilestoneChanged);
        }

        // Delete oldest block if size exceeds the maximum
        const maxLastBlocks = this.configuration.getRequired<number>("storage.maxLastBlocks");

        if (this.lastBlocks.size > maxLastBlocks) {
            this.lastBlocks = this.lastBlocks.delete(this.lastBlocks.first<Interfaces.IBlock>().data.height);
        }

        this.noBlockCounter = 0;
        this.p2pUpdateCounter = 0;
    }

    /**
     * Get the last blocks.
     */
    public getLastBlocks(): Interfaces.IBlock[] {
        return this.lastBlocks.valueSeq().reverse().toArray();
    }

    /**
     * Get the last blocks data.
     */
    public getLastBlocksData(headersOnly?: boolean): Seq<number, Interfaces.IBlockData> {
        return this.mapToBlockData(this.lastBlocks.valueSeq().reverse(), headersOnly);
    }

    /**
     * Get the last block ids.
     */
    public getLastBlockIds(): string[] {
        return this.lastBlocks
            .valueSeq()
            .reverse()
            .map((b) => {
                Utils.assert.defined<string>(b.data.id);

                return b.data.id;
            })
            .toArray();
    }

    /**
     * Get last blocks in the given height range in ascending order.
     * @param {Number} start
     * @param {Number} end
     */
    public getLastBlocksByHeight(start: number, end?: number, headersOnly?: boolean): Interfaces.IBlockData[] {
        const tail: number | undefined = end || start;

        Utils.assert.defined<number>(tail);

        const blocks = this.lastBlocks
            .valueSeq()
            .filter((block) => block.data.height >= start && block.data.height <= tail);

        return this.mapToBlockData(blocks, headersOnly).toArray() as Interfaces.IBlockData[];
    }

    /**
     * Get common blocks for the given IDs.
     */
    public getCommonBlocks(ids: string[]): Interfaces.IBlockData[] {
        const idsHash = {};

        for (const id of ids) {
            idsHash[id] = true;
        }

        return this.getLastBlocksData(true)
            .filter((block) => {
                Utils.assert.defined<string>(block.id);

                return idsHash[block.id];
            })
            .toArray() as Interfaces.IBlockData[];
    }

    /**
     * Cache the ids of the given transactions.
     */
    public cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { added: Interfaces.ITransactionData[]; notAdded: Interfaces.ITransactionData[] } {
        const notAdded: Interfaces.ITransactionData[] = [];
        const added: Interfaces.ITransactionData[] = transactions.filter((tx) => {
            Utils.assert.defined<string>(tx.id);

            if (this.cachedTransactionIds.has(tx.id)) {
                notAdded.push(tx);

                return false;
            }

            return true;
        });

        this.cachedTransactionIds = this.cachedTransactionIds.withMutations((cache) => {
            for (const tx of added) {
                Utils.assert.defined<string>(tx.id);

                cache.add(tx.id);
            }
        });

        // Cap the Set of last transaction ids to maxLastTransactionIds
        const maxLastTransactionIds = this.configuration.getRequired<number>("storage.maxLastTransactionIds");

        if (this.cachedTransactionIds.size > maxLastTransactionIds) {
            this.cachedTransactionIds = this.cachedTransactionIds.takeLast(maxLastTransactionIds);
        }

        return { added, notAdded };
    }

    /**
     * Drop all cached transaction ids.
     */
    public clearCachedTransactionIds(): void {
        this.cachedTransactionIds = this.cachedTransactionIds.clear();
    }

    /**
     * Get cached transaction ids.
     */
    public getCachedTransactionIds(): string[] {
        return this.cachedTransactionIds.toArray();
    }

    /**
     * Ping a block.
     */
    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        if (!this.blockPing) {
            return false;
        }

        if (this.blockPing.block.height === incomingBlock.height && this.blockPing.block.id === incomingBlock.id) {
            this.blockPing.count++;
            this.blockPing.last = new Date().getTime();

            return true;
        }

        return false;
    }

    /**
     * Push ping block.
     */
    public pushPingBlock(block: Interfaces.IBlockData, fromForger = false): void {
        if (this.blockPing) {
            this.logger.info(
                `Previous block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${
                    this.blockPing.count
                } times`,
            );
        }

        this.blockPing = {
            count: fromForger ? 0 : 1,
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }

    // Map Block instances to block data.
    private mapToBlockData(
        blocks: Seq<number, Interfaces.IBlock>,
        headersOnly?: boolean,
    ): Seq<number, Interfaces.IBlockData> {
        return blocks.map((block) => ({
            ...block.data,
            transactions: headersOnly ? undefined : block.transactions.map((tx) => tx.data),
        }));
    }
}
