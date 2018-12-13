import { bignumify } from "./bignumify";
import { createTable } from "./create-table";
import { calculateApproval, calculateProductivity } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

const delegateCalculator = { calculateApproval, calculateProductivity };
const roundCalculator = { calculateRound, isNewRound };
const supplyCalculator = { calculate };

export { bignumify, createTable, delegateCalculator, formatTimestamp, roundCalculator, supplyCalculator };
