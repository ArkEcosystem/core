import pluralize from "pluralize";

import { calculateApproval, calculateForgedTotal } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { httpie, HttpieResponse } from "./httpie";
import { isBlockChained } from "./is-block-chained";
import { isWhitelisted } from "./is-whitelisted";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";
import * as Plugins from "./transform-plugins";

export * from "@arkecosystem/utils";

export const delegateCalculator = { calculateApproval, calculateForgedTotal };
export const roundCalculator = { calculateRound, isNewRound };
export const supplyCalculator = { calculate };

export { formatTimestamp, httpie, HttpieResponse, isBlockChained, isWhitelisted, Plugins, pluralize };
