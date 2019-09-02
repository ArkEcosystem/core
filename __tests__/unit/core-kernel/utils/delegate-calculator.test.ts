import "jest-extended";

import { Wallets } from "@arkecosystem/core-state";
import { Managers, Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "@packages/core-kernel/src/utils/delegate-calculator";

let delegate: Wallets.Wallet;
let attributes;

beforeEach(() => {
    attributes = {
        producedBlocks: 0,
    };

    delegate = new Wallets.Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
    delegate.setAttribute("delegate", attributes);

    Managers.configManager.set("genesisBlock.totalAmount", 1000000 * 1e8);
});

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            attributes.voteBalance = Utils.BigNumber.make(10000 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            attributes.voteBalance = Utils.BigNumber.make(16500 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            attributes.forgedFees = Utils.BigNumber.make(10);
            attributes.forgedRewards = Utils.BigNumber.make(100);

            expect(calculateForgedTotal(delegate)).toBe("110");
        });
    });
});
