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

    buildWallets(height: number): Promise<boolean>;

    /* We have these methods on the connection since they rely on transactions, which is a DB specific detail
       Keep DB specifics away from the service layer
     */
    saveWallets(wallets: any[], force?: boolean): Promise<void>;

    saveBlock(block: models.Block): Promise<any>;

    deleteBlock(block: models.Block): Promise<any>;

    enqueueDeleteBlock(block: models.Block);

    enqueueDeleteRound(height: number);

    enqueueSaveBlock(block: models.Block);

    commitQueuedQueries();
}
