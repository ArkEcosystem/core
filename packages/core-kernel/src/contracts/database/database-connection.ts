import { Interfaces } from "@arkecosystem/crypto";

import { BlocksRepository } from "./database-repository";
import { RoundsRepository } from "./database-repository";
import { TransactionsRepository } from "./database-repository";
import { WalletsRepository } from "./database-repository";

export interface Connection {
    options: Record<string, any>;

    blocksRepository: BlocksRepository;
    walletsRepository: WalletsRepository;
    roundsRepository: RoundsRepository;
    transactionsRepository: TransactionsRepository;

    make(): Promise<Connection>;

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    buildWallets(): Promise<void>;

    saveBlock(block: Interfaces.IBlock): Promise<void>;

    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;

    resetAll(): Promise<void>;

    deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void>;
}
