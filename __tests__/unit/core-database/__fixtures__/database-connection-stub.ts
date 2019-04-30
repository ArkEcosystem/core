// tslint:disable:no-empty

import { Database } from "@arkecosystem/core-interfaces";
import { Blocks } from "@arkecosystem/crypto";

export class DatabaseConnectionStub implements Database.IConnection {
    public blocksRepository: Database.IBlocksRepository;
    public roundsRepository: Database.IRoundsRepository;
    public transactionsRepository: Database.ITransactionsRepository;
    public walletsRepository: Database.IWalletsRepository;
    public options: any;

    public buildWallets(): Promise<void> {
        return null;
    }

    public commitQueuedQueries(): any {}

    public connect(): Promise<void> {
        return undefined;
    }

    public deleteBlock(block: Blocks.Block): Promise<any> {
        return undefined;
    }

    public disconnect(): Promise<void> {
        return undefined;
    }

    public enqueueDeleteBlock(block: Blocks.Block): any {}

    public enqueueDeleteRound(height: number): any {}

    public async make(): Promise<Database.IConnection> {
        return this;
    }

    public saveBlock(block: Blocks.Block): Promise<any> {
        return undefined;
    }

    public saveBlocks(blocks: Blocks.Block[]): Promise<any> {
        return undefined;
    }
}
