import { Blocks } from "@arkecosystem/crypto";
import { IBlocksRepository } from "./database-repository";
import { IRoundsRepository } from "./database-repository";
import { ITransactionsRepository } from "./database-repository";
import { IWalletsRepository } from "./database-repository";

export interface IConnection {
    options: any;

    blocksRepository: IBlocksRepository;
    walletsRepository: IWalletsRepository;
    roundsRepository: IRoundsRepository;
    transactionsRepository: ITransactionsRepository;

    make(): Promise<IConnection>;

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    buildWallets(): Promise<boolean>;

    saveBlock(block: Blocks.Block): Promise<void>;

    deleteBlock(block: Blocks.Block): Promise<void>;

    enqueueDeleteBlock(block: Blocks.Block): void;

    enqueueDeleteRound(height: number): void;

    commitQueuedQueries(): Promise<void>;
}
