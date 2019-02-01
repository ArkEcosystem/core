import { bignumify } from "./bignumify";
import { CappedSet } from "./capped-set";
import { calculateApproval, calculateProductivity } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateProductivity };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export { bignumify, CappedSet, delegateCalculator, formatTimestamp, roundCalculator, supplyCalculator };
