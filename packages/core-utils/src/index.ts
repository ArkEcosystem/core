import { bignumify } from "./bignumify";
import { CappedSet } from "./capped-set";
import { calculateApproval, calculateForgedTotal, calculateProductivity } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { hasSomeProperty } from "./has-some-property";
import { NSect } from "./nsect";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateProductivity, calculateForgedTotal };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export {
    CappedSet,
    NSect,
    bignumify,
    delegateCalculator,
    formatTimestamp,
    hasSomeProperty,
    roundCalculator,
    supplyCalculator,
};
