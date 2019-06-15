import { Interfaces } from "@arkecosystem/crypto";
import { IBlocksRepository } from "./database-repository";
import { IRoundsRepository } from "./database-repository";
import { ITransactionsRepository } from "./database-repository";
import { IWalletsRepository } from "./database-repository";

export interface IConnection {
    options: Record<string, any>;

    blocksRepository: IBlocksRepository;
    walletsRepository: IWalletsRepository;
    roundsRepository: IRoundsRepository;
    transactionsRepository: ITransactionsRepository;

    make(): Promise<IConnection>;

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    buildWallets(): Promise<void>;

    saveBlock(block: Interfaces.IBlock): Promise<void>;

    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;

    resetAll(): Promise<void>;

    deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void>;
}
