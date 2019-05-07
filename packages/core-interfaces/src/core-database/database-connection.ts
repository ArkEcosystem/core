import { IBlocksRepository } from "./database-repository";
import { IRoundsRepository } from "./database-repository";
import { ITransactionsRepository } from "./database-repository";
import { IWalletsRepository } from "./database-repository";

import { models } from "@arkecosystem/crypto";

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

    saveBlock(block: models.Block): Promise<void>;

    deleteBlock(block: models.Block): Promise<void>;

    enqueueDeleteBlock(block: models.Block): void;

    enqueueDeleteRound(height: number): void;

    commitQueuedQueries(): Promise<void>;
}
