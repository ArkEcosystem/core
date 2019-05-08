import { Interfaces, Utils } from "@arkecosystem/crypto";
import { IBlocksPaginated } from "../business-repository";
import { ISearchParameters } from "../search";
import { IRepository } from "./repository";

export interface IBlocksRepository extends IRepository {
    findById(id: string): Promise<Interfaces.IBlockData>;
    findByIds(id: string[]): Promise<Interfaces.IBlockData[]>;

    findByHeight(height: number): Promise<Interfaces.IBlockData>;
    findByHeights(heights: number[]): Promise<Interfaces.IBlockData[]>;

    count(): Promise<number>;
    common(ids: string[]): Promise<Interfaces.IBlockData[]>;
    heightRange(start: number, end: number): Promise<Interfaces.IBlockData[]>;
    latest(): Promise<Interfaces.IBlockData>;
    recent(count: number): Promise<Interfaces.IBlockData[]>;

    statistics(): Promise<{
        numberOfTransactions: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
        count: number;
    }>;

    top(count: number): Promise<Interfaces.IBlockData[]>;
    delete(id: string): Promise<void>;

    getBlockRewards(): Promise<any>;

    getLastForgedBlocks(): Promise<any>;

    /* TODO: Remove with V1 */
    findAll(params: ISearchParameters): Promise<IBlocksPaginated>;
    search(params: ISearchParameters): Promise<IBlocksPaginated>;
}
