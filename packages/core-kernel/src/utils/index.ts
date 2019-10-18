import { calculateApproval, calculateForgedTotal } from "./delegate-calculator";
import { calculateTransactionExpiration } from "./expiration-calculator";
import { formatTimestamp } from "./format-timestamp";
import { isBlockChained } from "./is-block-chained";
import { isWhitelisted } from "./is-whitelisted";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";
import * as Plugins from "./transform-plugins";

export * from "@arkecosystem/utils";
export * from "./expiration-calculator";

export const delegateCalculator = { calculateApproval, calculateForgedTotal };
export const expirationCalculator = { calculateTransactionExpiration };
export const roundCalculator = { calculateRound, isNewRound };
export const supplyCalculator = { calculate };

export { formatTimestamp, isBlockChained, isWhitelisted, Plugins };
