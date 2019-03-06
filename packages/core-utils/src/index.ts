import { bignumify } from "./bignumify";
import { CappedSet } from "./capped-set";
import { calculateApproval, calculateProductivity } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { httpie } from "./httpie";
import { NSect } from "./nsect";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateProductivity };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export { CappedSet, NSect, bignumify, delegateCalculator, formatTimestamp, httpie, roundCalculator, supplyCalculator };
