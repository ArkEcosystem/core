import { CappedSet } from "./capped-set";
import { calculateApproval, calculateForgedTotal } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { hasSomeProperty } from "./has-some-property";
import { httpie, IHttpieResponse } from "./httpie";
import { isBlockChained } from "./is-block-chained";
import { NSect } from "./nsect";
import { OrderedCappedMap } from "./ordered-capped-map";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

export const delegateCalculator = { calculateApproval, calculateForgedTotal };
export const roundCalculator = { calculateRound, isNewRound };
export const supplyCalculator = { calculate };

export {
    CappedSet,
    formatTimestamp,
    hasSomeProperty,
    httpie,
    IHttpieResponse,
    isBlockChained,
    NSect,
    OrderedCappedMap,
};
