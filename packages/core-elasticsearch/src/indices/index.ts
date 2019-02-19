import { Blocks } from "./blocks";
import { Rounds } from "./rounds";
import { Transactions } from "./transactions";
import { Wallets } from "./wallets";

export function watchIndices(options: Record<string, any>): void {
    [Blocks, Transactions, Wallets, Rounds].forEach(Indexer => new Indexer(options.chunkSize));
}
