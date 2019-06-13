import { BlockRepository } from "./blocks";
import { TransactionsRepository } from "./transactions";

export const blocksRepository = new BlockRepository();
export const transactionsRepository = new TransactionsRepository();

export { BlockRepository, TransactionsRepository };
