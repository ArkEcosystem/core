import { CappedSet } from "./capped-set";
import { NSect } from "./nsect";
import { bignumify } from "./bignumify";
import { calculate } from "./supply-calculator";
import { calculateApproval, calculateProductivity } from "./delegate-calculator";
import { calculateRound, isNewRound } from "./round-calculator";
import { formatTimestamp } from "./format-timestamp";

const delegateCalculator = { calculateApproval, calculateProductivity };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export {
    CappedSet,
    NSect,
    bignumify,
    delegateCalculator,
    formatTimestamp,
    roundCalculator,
    supplyCalculator
};
