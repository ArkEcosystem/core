import { BlocksRepository } from "./blocks";
import { MigrationsRepository } from "./migrations";
import { RoundsRepository } from "./rounds";
import { TransactionsRepository } from "./transactions";
import { WalletsRepository } from "./wallets";

export const repositories = {
    blocks: BlocksRepository,
    migrations: MigrationsRepository,
    rounds: RoundsRepository,
    transactions: TransactionsRepository,
    wallets: WalletsRepository,
};
