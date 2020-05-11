export * as Blocks from "./blocks";
export * as Errors from "./errors";
export * as Interfaces from "./interfaces";
export * as Validation from "./validation";

import * as Crypto from "@arkecosystem/crypto";

import { IBlockData } from "./interfaces";

interface TransactionsManager extends Crypto.Transactions.TransactionsManager<IBlockData> {}

interface CryptoManager extends Crypto.CryptoManager<IBlockData> {}

// import * as Constants from "./constants";
// import { CryptoManager } from "./crypto-manager";
// import * as Enums from "./enums";
// import * as Errors from "./errors";
// import * as Interfaces from "./interfaces";
// import * as Transactions from "./transactions";
// // import { TransactionsManager } from "./transactions/index";
// import * as Types from "./types";

export { CryptoManager, TransactionsManager };
