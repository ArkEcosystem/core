import { BlocksRepository } from "./blocks";
import { MigrationsRepository } from "./migrations";
import { RoundsRepository } from "./rounds";
import { TransactionsRepository } from "./transactions";
export declare const repositories: {
    blocks: typeof BlocksRepository;
    migrations: typeof MigrationsRepository;
    rounds: typeof RoundsRepository;
    transactions: typeof TransactionsRepository;
};
