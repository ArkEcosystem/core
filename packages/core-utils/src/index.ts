import { bignumify } from "./bignumify";
import { CappedSet } from "./capped-set";
import { calculateApproval, calculateForgedTotal } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { hasSomeProperty } from "./has-some-property";
import { httpie, IHttpieResponse } from "./httpie";
import { isBlockChained } from "./is-block-chained";
import { NSect } from "./nsect";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateForgedTotal };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export {
    bignumify,
    CappedSet,
    delegateCalculator,
    formatTimestamp,
    hasSomeProperty,
    httpie,
    IHttpieResponse,
    isBlockChained,
    NSect,
    roundCalculator,
    supplyCalculator,
};
