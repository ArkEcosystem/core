import "jest-extended";
import "./mocks/core-container-calculator";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "../../../packages/core-utils/src/delegate-calculator";

let delegate: Wallets.Wallet;
let attributes: State.IWalletDelegateAttributes;

beforeEach(() => {
    attributes = {
        producedBlocks: 0,
    } as State.IWalletDelegateAttributes;

    delegate = new Wallets.Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
    delegate.setAttribute("delegate", attributes);
});

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            attributes.voteBalance = Utils.BigNumber.make(10000 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly without a height", () => {
            attributes.voteBalance = Utils.BigNumber.make(10000 * 1e8);

            expect(calculateApproval(delegate)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            attributes.voteBalance = Utils.BigNumber.make(16500 * 1e8);

            expect(calculateApproval(delegate, 1)).toBe(1.65);

            attributes.voteBalance = Utils.BigNumber.make(100 * 1e8);
            expect(calculateApproval(delegate, 1)).toBe(0.01);
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
