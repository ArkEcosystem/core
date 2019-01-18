import { BlockRepository } from "./blocks";
import { TransactionsRepository } from "./transactions";

const blocksRepository = new BlockRepository();
const transactionsRepository = new TransactionsRepository();

export { blocksRepository, transactionsRepository, BlockRepository, TransactionsRepository };
