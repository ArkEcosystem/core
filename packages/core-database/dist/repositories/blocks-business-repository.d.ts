import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {
    private readonly databaseServiceProvider;
    constructor(databaseServiceProvider: () => Database.IDatabaseService);
    search(params?: Database.IParameters): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }>;
    findAllByGenerator(generatorPublicKey: string, paginate: Database.ISearchPaginate): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }>;
    findByHeight(height: number): Promise<Interfaces.IBlockData>;
    findById(id: string): Promise<Interfaces.IBlockData>;
    findByIdOrHeight(idOrHeight: any): Promise<Interfaces.IBlockData>;
    getBlockRewards(): Promise<any>;
    getLastForgedBlocks(): Promise<any>;
    getDelegatesForgedBlocks(): Promise<any>;
    private parseSearchParams;
}
