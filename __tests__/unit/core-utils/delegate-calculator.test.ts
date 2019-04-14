import "jest-extended";
import "./mocks/core-container-calculator";

import { Wallet } from "@arkecosystem/core-database";
import { Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "../../../packages/core-utils/src/delegate-calculator";

let delegate: Wallet;

beforeEach(() => {
    delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
    delegate.producedBlocks = 0;
});

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            delegate.voteBalance = Utils.BigNumber.make(10000 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly without a height", () => {
            delegate.voteBalance = Utils.BigNumber.make(10000 * 1e8);

            expect(calculateApproval(delegate)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            delegate.voteBalance = Utils.BigNumber.make(16500 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            delegate.forgedFees = Utils.BigNumber.make(10);
            delegate.forgedRewards = Utils.BigNumber.make(100);

            expect(calculateForgedTotal(delegate)).toBe(110);
        });
    });
});
