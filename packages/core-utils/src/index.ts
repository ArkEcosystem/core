import { bignumify } from "./bignumify";
import { createTable } from "./create-table";
import { calculateApproval, calculateProductivity } from "./delegate-calculator";
import { formatTimestamp } from "./format-timestamp";
import { calculateRound, isNewRound } from "./round-calculator";
import { calculate } from "./supply-calculator";

export default {
  bignumify,
  createTable,
  delegateCalculator: { calculateApproval, calculateProductivity },
  formatTimestamp,
  roundCalculator: { calculateRound, isNewRound },
  supplyCalculator: { calculate },
};
