import { IBlocksRepository } from "./database-repository";
import { IRoundsRepository } from "./database-repository";
import { ITransactionsRepository } from "./database-repository";
import { IWalletsRepository } from "./database-repository";

import { models } from "@arkecosystem/crypto";

export interface IDatabaseConnection {
    options: any;

    blocksRepository: IBlocksRepository;
    walletsRepository: IWalletsRepository;
    roundsRepository: IRoundsRepository;
    transactionsRepository: ITransactionsRepository;

    make(): Promise<IDatabaseConnection>;

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    buildWallets(): Promise<boolean>;

    saveBlock(block: models.Block): Promise<any>;

    deleteBlock(block: models.Block): Promise<any>;

    enqueueDeleteBlock(block: models.Block);

    enqueueDeleteRound(height: number);

    enqueueSaveBlock(block: models.Block);

    commitQueuedQueries();
}
