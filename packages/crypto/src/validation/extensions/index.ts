import { address } from "./address";
import { bignumber } from "./bignumber";
import { block } from "./block";
import { blockId } from "./block-id";
import { publicKey } from "./public-key";
import { transactionArray } from "./transaction-array";
import { transactions } from "./transactions";
import { username } from "./username";

export const extensions = [address, bignumber, publicKey, username, blockId, ...transactions, transactionArray, block];
