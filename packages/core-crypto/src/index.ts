export * as Blocks from "./blocks";
export * as Errors from "./errors";
export * as Interfaces from "./interfaces";
export * as Validation from "./validation";

import * as Crypto from "@arkecosystem/crypto";

import { IBlockData } from "./interfaces";

class TransactionsManager extends Crypto.Transactions.TransactionsManager<IBlockData> {}

class CryptoManager extends Crypto.CryptoManager<IBlockData> {}

// TODO: re-export all crypto package from here?

export { CryptoManager, TransactionsManager };
