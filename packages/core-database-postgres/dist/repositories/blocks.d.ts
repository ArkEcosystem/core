import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Block } from "../models";
import { Repository } from "./repository";
export declare class BlocksRepository extends Repository implements Database.IBlocksRepository {
    search(params: Database.ISearchParameters): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }>;
    findById(id: string): Promise<Interfaces.IBlockData>;
    findByIds(ids: string[]): Promise<Interfaces.IBlockData[]>;
    findByHeight(height: number): Promise<Interfaces.IBlockData>;
    findByHeights(heights: number[]): Promise<Interfaces.IBlockData[]>;
    count(): Promise<number>;
    getBlockRewards(): Promise<any>;
    getLastForgedBlocks(): Promise<any>;
    getDelegatesForgedBlocks(): Promise<any>;
    common(ids: string[]): Promise<Interfaces.IBlockData[]>;
    headers(start: number, end: number): Promise<Interfaces.IBlockData[]>;
    heightRange(start: number, end: number): Promise<Interfaces.IBlockData[]>;
    heightRangeWithTransactions(start: number, end: number): Promise<Database.IDownloadBlock[]>;
    latest(): Promise<Interfaces.IBlockData>;
    recent(): Promise<Interfaces.IBlockData[]>;
    statistics(): Promise<{
        numberOfTransactions: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
        count: number;
    }>;
    top(count: number): Promise<Interfaces.IBlockData[]>;
    delete(ids: string[], db: any): Promise<void>;
    getModel(): Block;
}
