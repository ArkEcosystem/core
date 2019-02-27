import { bignumify } from "./bignumify";
import { CappedSet } from "./capped-set";
import { calculateApproval, calculateProductivity, calculateForgedTotal } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { NSect } from "./nsect";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateProductivity, calculateForgedTotal };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export { CappedSet, NSect, bignumify, delegateCalculator, formatTimestamp, roundCalculator, supplyCalculator };
