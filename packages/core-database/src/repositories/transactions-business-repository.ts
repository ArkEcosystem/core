import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces } from "@arkecosystem/crypto";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class TransactionsBusinessRepository implements Database.ITransactionsBusinessRepository {
    constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public async search(
        params: Database.IParameters = {},
        sequenceOrder: "asc" | "desc" = "desc",
    ): Promise<Database.ITransactionsPaginated> {
        try {
            const result = await this.databaseServiceProvider().connection.transactionsRepository.search(
                this.parseSearchParameters(params, sequenceOrder),
            );
            result.rows = await this.mapBlocksToTransactions(result.rows);

            return result;
        } catch (e) {
            return { rows: [], count: 0 };
        }
    }

    public async allVotesBySender(
        senderPublicKey: string,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.search({
            ...{ senderPublicKey, type: Enums.TransactionTypes.Vote },
            ...parameters,
        });
    }

    public async findAllByBlock(
        blockId: string,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.search({ blockId, ...parameters }, "asc");
    }

    public async findAllByRecipient(
        recipientId: string,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.search({ recipientId, ...parameters });
    }

    public async findAllBySender(
        senderPublicKey: string,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.search({ senderPublicKey, ...parameters });
    }

    public async findAllByType(
        type: number,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.search({ type, ...parameters });
    }

    // @TODO: simplify this
    public async findAllByWallet(
        wallet: State.IWallet,
        parameters: Database.IParameters = {},
    ): Promise<Database.ITransactionsPaginated> {
        const { transactionsRepository }: Database.IConnection = this.databaseServiceProvider().connection;
        const searchParameters = new SearchParameterConverter(transactionsRepository.getModel()).convert(parameters);

        const result = await transactionsRepository.findAllByWallet(
            wallet,
            searchParameters.paginate,
            searchParameters.orderBy,
        );
        result.rows = await this.mapBlocksToTransactions(result.rows);

        return result;
    }

    // @TODO: simplify this
    public async findById(id: string) {
        return (await this.mapBlocksToTransactions(
            await this.databaseServiceProvider().connection.transactionsRepository.findById(id),
        ))[0];
    }

    public async findByTypeAndId(type: number, id: string) {
        const results = await this.search({ type, id });
        return results.rows.length ? results.rows[0] : undefined;
    }

    public async getFeeStatistics(
        days: number,
    ): Promise<
        Array<{
            type: number;
            fee: number;
            timestamp: number;
        }>
    > {
        return this.databaseServiceProvider().connection.transactionsRepository.getFeeStatistics(
            days,
            app.resolveOptions("transaction-pool").dynamicFees.minFeeBroadcast,
        );
    }

    public async getAssetsByType(type: Enums.TransactionTypes | number): Promise<any> {
        return this.databaseServiceProvider().connection.transactionsRepository.getAssetsByType(type);
    }

    public async getReceivedTransactions(): Promise<any> {
        return this.databaseServiceProvider().connection.transactionsRepository.getReceivedTransactions();
    }

    public async getSentTransactions(): Promise<any> {
        return this.databaseServiceProvider().connection.transactionsRepository.getSentTransactions();
    }

    private getPublicKeyFromAddress(senderId: string): string {
        const { walletManager }: Database.IDatabaseService = this.databaseServiceProvider();

        return walletManager.has(senderId) ? walletManager.findByAddress(senderId).publicKey : undefined;
    }

    private async mapBlocksToTransactions(rows): Promise<Interfaces.ITransactionData[]> {
        if (!Array.isArray(rows)) {
            rows = rows ? [rows] : [];
        }

        // 1. get heights from cache
        const missingFromCache = [];

        for (let i = 0; i < rows.length; i++) {
            const cachedBlock = this.getCachedBlock(rows[i].blockId);

            if (cachedBlock) {
                rows[i].block = cachedBlock;
            } else {
                missingFromCache.push({
                    index: i,
                    blockId: rows[i].blockId,
                });
            }
        }

        // 2. get uncached blocks from database
        if (missingFromCache.length) {
            const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
            const result = await blocksRepository.findByIds(missingFromCache.map(d => d.blockId));

            for (const missing of missingFromCache) {
                const block: Interfaces.IBlockData = result.find(item => item.id === missing.blockId);

                if (block) {
                    rows[missing.index].block = block;
                    this.cacheBlock(block);
                }
            }
        }

        return rows;
    }

    private getCachedBlock(blockId: string): { height: number; id: string } {
        // TODO: Improve caching mechanism. Would be great if we have the caching directly linked to the data-layer repos.
        // Such that when you try to fetch a block, it'll transparently check the cache first, before querying db.
        const height = this.databaseServiceProvider().cache.get(`heights:${blockId}`);

        return height ? { height, id: blockId } : undefined;
    }

    private cacheBlock({ id, height }: Interfaces.IBlockData): void {
        this.databaseServiceProvider().cache.set(`heights:${id}`, height);
    }

    private parseSearchParameters(params: any, sequenceOrder: "asc" | "desc" = "desc"): Database.ISearchParameters {
        const databaseService: Database.IDatabaseService = this.databaseServiceProvider();

        if (params.senderId) {
            const senderPublicKey = this.getPublicKeyFromAddress(params.senderId);

            if (!senderPublicKey) {
                throw new Error(`Invalid senderId:${params.senderId}`);
            }

            delete params.senderId;

            params.senderPublicKey = senderPublicKey;
        }

        if (params.addresses) {
            if (!params.recipientId) {
                params.recipientId = params.addresses;
            }
            if (!params.senderPublicKey) {
                params.senderPublicKey = params.addresses.map(address => {
                    return this.getPublicKeyFromAddress(address);
                });
            }

            delete params.addresses;
        }

        const searchParameters: Database.ISearchParameters = new SearchParameterConverter(
            databaseService.connection.transactionsRepository.getModel(),
        ).convert(params);

        if (!searchParameters.paginate) {
            searchParameters.paginate = {
                offset: 0,
                limit: 100,
            };
        }

        if (!searchParameters.orderBy.length) {
            searchParameters.orderBy.push({
                field: "timestamp",
                direction: "desc",
            });
        }

        searchParameters.orderBy.push({
            field: "sequence",
            direction: sequenceOrder,
        });

        return searchParameters;
    }
}
