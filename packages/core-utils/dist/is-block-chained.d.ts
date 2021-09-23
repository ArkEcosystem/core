import { Logger } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare const isBlockChained: (previousBlock: Interfaces.IBlockData, nextBlock: Interfaces.IBlockData, logger?: Logger.ILogger) => boolean;
