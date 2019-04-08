import { IBlocksRepository } from "./database-repository";
import { IRoundsRepository } from "./database-repository";
import { ITransactionsRepository } from "./database-repository";
import { IWalletsRepository } from "./database-repository";

import { blocks } from "@arkecosystem/crypto";

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

    saveBlock(block: blocks.Block): Promise<void>;

    deleteBlock(block: blocks.Block): Promise<void>;

    enqueueDeleteBlock(block: blocks.Block): void;

    enqueueDeleteRound(height: number): void;

    commitQueuedQueries(): Promise<void>;
}
