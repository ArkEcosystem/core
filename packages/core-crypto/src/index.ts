export * as Blocks from "./blocks";
export * as Errors from "./errors";
export * as Interfaces from "./interfaces";
export * as Validation from "./validation";

import * as Crypto from "@arkecosystem/crypto";

import { IBlockData } from "./interfaces";

class TransactionTools extends Crypto.Transactions.TransactionTools<IBlockData> {}

class TransactionManager extends Crypto.Transactions.TransactionManager<IBlockData> {}

class CryptoManager extends Crypto.CryptoManager<IBlockData> {}

export { CryptoManager, TransactionManager, TransactionTools };
