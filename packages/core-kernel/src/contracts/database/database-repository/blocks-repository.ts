import { Interfaces, Utils } from "@arkecosystem/crypto";

import { BlocksPaginated } from "../business-repository";
import { DownloadBlock } from "../database-service";
import { SearchParameters } from "../search";
import { Repository } from "./repository";

export interface BlocksRepository extends Repository {
    findById(id: string): Promise<Interfaces.IBlockData>;
    findByIds(id: string[]): Promise<Interfaces.IBlockData[]>;

    findByHeight(height: number): Promise<Interfaces.IBlockData>;
    findByHeights(heights: number[]): Promise<Interfaces.IBlockData[]>;

    count(): Promise<number>;
    common(ids: string[]): Promise<Interfaces.IBlockData[]>;
    heightRange(start: number, end: number): Promise<Interfaces.IBlockData[]>;
    heightRangeWithTransactions(start: number, end: number): Promise<DownloadBlock[]>;
    latest(): Promise<Interfaces.IBlockData>;
    recent(count: number): Promise<Interfaces.IBlockData[]>;

    statistics(): Promise<{
        numberOfTransactions: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
        count: number;
    }>;

    top(count: number): Promise<Interfaces.IBlockData[]>;
    delete(ids: string[], db: any): Promise<void>;

    getBlockRewards(): Promise<any>;

    getLastForgedBlocks(): Promise<any>;

    getDelegatesForgedBlocks(): Promise<any>;

    search(params: SearchParameters): Promise<BlocksPaginated>;
}
