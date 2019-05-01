import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces } from "@arkecosystem/crypto";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class TransactionsBusinessRepository implements Database.ITransactionsBusinessRepository {
    constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public async allVotesBySender(senderPublicKey: any, parameters: any): Promise<Database.ITransactionsPaginated> {
        return this.findAll({
            ...{ senderPublicKey, type: Enums.TransactionTypes.Vote },
            ...parameters,
        });
    }

    // TODO: Remove with v1
    public async findAll(
        params: any,
        sequenceOrder: "asc" | "desc" = "desc",
    ): Promise<Database.ITransactionsPaginated> {
        try {
            const result = await this.databaseServiceProvider().connection.transactionsRepository.findAll(
                this.parseISearchParameters(params, sequenceOrder),
            );
            result.rows = await this.mapBlocksToTransactions(result.rows);

            return result;
        } catch (e) {
            return { rows: [], count: 0 };
        }
    }

    public async findAllByBlock(blockId: string, parameters: any = {}): Promise<Database.ITransactionsPaginated> {
        return this.findAll({ blockId, ...parameters }, "asc");
    }

    public async findAllByRecipient(
        recipientId: string,
        parameters: any = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.findAll({ recipientId, ...parameters });
    }

    public async findAllBySender(
        senderPublicKey: string,
        parameters: any = {},
    ): Promise<Database.ITransactionsPaginated> {
        return this.findAll({ senderPublicKey, ...parameters });
    }

    public async findAllByType(type: number, parameters: any = {}): Promise<Database.ITransactionsPaginated> {
        return this.findAll({ type, ...parameters });
    }

    public async findAllByWallet(
        wallet: Database.IWallet,
        parameters?: Database.IParameters,
    ): Promise<Database.ITransactionsPaginated> {
        const { transactionsRepository } = this.databaseServiceProvider().connection;
        const searchParameters = new SearchParameterConverter(transactionsRepository.getModel()).convert(parameters);

        const result = await transactionsRepository.findAllByWallet(
            wallet,
            searchParameters.paginate,
            searchParameters.orderBy,
        );
        result.rows = await this.mapBlocksToTransactions(result.rows);

        return result;
    }

    public async findAllLegacy(parameters: Database.IParameters): Promise<void> {
        throw new Error("This is deprecated in v2");
    }

    public async findById(id: string) {
        return (await this.mapBlocksToTransactions(
            await this.databaseServiceProvider().connection.transactionsRepository.findById(id),
        ))[0];
    }

    public async findByTypeAndId(type: any, id: string) {
        const results = await this.findAll({ type, id });
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

    public async search(params: any) {
        try {
            const result = await this.databaseServiceProvider().connection.transactionsRepository.search(
                this.parseISearchParameters(params),
            );

            result.rows = await this.mapBlocksToTransactions(result.rows);

            return result;
        } catch (e) {
            return { rows: [], count: 0 };
        }
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

    private parseISearchParameters(params: any, sequenceOrder: "asc" | "desc" = "desc"): Database.ISearchParameters {
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

        // TODO: supported by 'findAll' but was replaced by 'addresses' in 'search' so remove this when removing v1 code
        if (params.ownerId) {
            // custom OP here
            params.ownerWallet = databaseService.walletManager.findByAddress(params.ownerId);
            delete params.ownerId;
        }

        const searchParameters = new SearchParameterConverter(
            databaseService.connection.transactionsRepository.getModel(),
        ).convert(params);
        if (!searchParameters.paginate) {
            searchParameters.paginate = {
                offset: 0,
                limit: 100,
            };
        }

        if (!searchParameters.orderBy.length) {
            // default order-by
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
