import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { constants } from "@arkecosystem/crypto";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class TransactionsBusinessRepository implements Database.ITransactionsBusinessRepository {

    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {
    }

    public allVotesBySender(senderPublicKey: any, parameters: any): Promise<any> {
        return this.findAll({
            ...{ senderPublicKey, type: constants.TransactionTypes.Vote },
            ...parameters,
        });
    }

    public async findAll(params: any, sequenceOrder: "asc" | "desc" = "desc") {
        const databaseService = this.databaseServiceProvider();
        // Custom logic for these fields. Fetch/Prepare the necessary data before sending the data layer repo.
        if (params.senderId) {
            const senderPublicKey = this.getPublicKeyFromAddress(params.senderId);

            if (!senderPublicKey) {
                return { rows: [], count: 0 };
            }
            delete params.senderId;
            params.senderPublicKey = senderPublicKey;
        }


        if (params.ownerId) {
            // custom OP here
            params.ownerWallet = databaseService.walletManager.findByAddress(params.ownerId);
            delete params.ownerId;
        }

        const searchParameters = new SearchParameterConverter(databaseService.connection.transactionsRepository.getModel()).convert(params);

        if(!searchParameters.paginate) {
            searchParameters.paginate = {
                offset: 0,
                limit: 100
            };
        }

        searchParameters.orderBy.push({
            field: "sequence",
            direction: sequenceOrder
        });

        const result = await databaseService.connection.transactionsRepository.findAll(searchParameters);
        result.rows = await this.mapBlocksToTransactions(result.rows);

        return result;
    }

    public async findAllByBlock(blockId: any, parameters: any = {}) {
        return this.findAll({ blockId, ...parameters }, "asc");
    }

    public async findAllByRecipient(recipientId: any, parameters: any = {}) {
        return this.findAll({ recipientId, ...parameters })
    }

    public async findAllBySender(senderPublicKey: any, parameters: any = {}) {
        return this.findAll({ senderPublicKey, ...parameters });
    }

    public async findAllByType(type: any, parameters: any = {}) {
        return this.findAll({ type, ...parameters });
    }

    public async findAllByWallet(wallet: any, parameters: any) {
        const transactionsRepository = this.databaseServiceProvider().connection.transactionsRepository;
        const searchParameters = new SearchParameterConverter(transactionsRepository.getModel()).convert(parameters);
        const result = await transactionsRepository.findAllByWallet(wallet, searchParameters.paginate, searchParameters.orderBy);
        return await this.mapBlocksToTransactions(result.rows);
    }

    public findAllLegacy(parameters: any): Promise<any> {
        throw new Error("This is deprecated in v2");
    }

    public findById(id: string): Promise<any> {
        return this.databaseServiceProvider().connection.transactionsRepository.findById(id);
    }

    public async findByTypeAndId(type: any, id: string) {
        const results = await this.findAll({ type, id });
        return results.rows.length ? results.rows[0]: null;
    }

    public async findWithVendorField() {
        const rows = await this.databaseServiceProvider().connection.transactionsRepository.findWithVendorField();
        return this.mapBlocksToTransactions(rows);
    }

    public async getFeeStatistics() {
        const opts = app.resolveOptions("transactionPool");
        return await this.databaseServiceProvider().connection.transactionsRepository.getFeeStatistics(opts.dynamicFees.minFeeBroadcast)
    }


    // TODO: At some point we need to combine 'search' and 'findAll'
    public async search(parameters: any) {
        if (parameters.addresses) {
            if (!parameters.recipientId) {
                parameters.recipientId = parameters.addresses;
            }
            if (!parameters.senderPublicKey) {
                parameters.senderPublicKey = parameters.addresses.map(address => {
                    return this.getPublicKeyFromAddress(address);
                });
            }

            delete parameters.addresses;
        }
        return this.findAll(parameters);
    }

    private getPublicKeyFromAddress(senderId: string): string {
        const walletManager = this.databaseServiceProvider().walletManager;
        return walletManager.exists(senderId) ? walletManager.findByAddress(senderId).publicKey : null;
    }

    private async mapBlocksToTransactions(rows) {

        if (!Array.isArray(rows)) {
            rows = [rows]
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
                const block = result.find(item => item.id === missing.blockId);
                if (block) {
                    rows[missing.index].block = block;
                    this.cacheBlock(block);
                }
            }
        }

        return rows;
    }

    private getCachedBlock(blockId): any {
        // TODO: Improve caching mechanism. Would be great if we have the caching directly linked to the data-layer repos.
        // Such that when you try to fetch a block, it'll transparently check the cache first, before querying db.
        const height = this.databaseServiceProvider().cache.get(`heights:${blockId}`);
        return height ? { height, id: blockId } : null;
    }

    /**
     * Stores the height of the block on the cache
     * @param  {Object} block
     * @param  {String} block.id
     * @param  {Number} block.height
     */
    private cacheBlock({ id, height }): void {
        this.databaseServiceProvider().cache.set(`heights:${id}`, height);
    }

}
