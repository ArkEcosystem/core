import "jest-extended";

import { isNewRound } from "@packages/core-kernel/src/utils/round-calculator";
import { devnet } from "@packages/crypto/src/networks";

describe("Round Calculator", () => {
    describe("isNewRound", () => {
        it("should determine the beginning of a new round", () => {
            expect(isNewRound(1, devnet.milestones)).toBeTrue();
            expect(isNewRound(2, devnet.milestones)).toBeFalse();
            expect(isNewRound(52, devnet.milestones)).toBeTrue();
            expect(isNewRound(53, devnet.milestones)).toBeFalse();
            expect(isNewRound(54, devnet.milestones)).toBeFalse();
            expect(isNewRound(103, devnet.milestones)).toBeTrue();
            expect(isNewRound(104, devnet.milestones)).toBeFalse();
            expect(isNewRound(154, devnet.milestones)).toBeTrue();
        });

        it("should be ok when changing delegate count", () => {
            const milestones = [
                { height: 1, activeDelegates: 2 }, // R1
                { height: 3, activeDelegates: 3 }, // R2
                { height: 6, activeDelegates: 1 }, // R3
                { height: 10, activeDelegates: 51 }, // R7
                { height: 62, activeDelegates: 51 }, // R8
            ];

            // 2 Delegates
            expect(isNewRound(1, milestones)).toBeTrue();
            expect(isNewRound(2, milestones)).toBeFalse();

            // 3 Delegates
            expect(isNewRound(3, milestones)).toBeTrue();
            expect(isNewRound(4, milestones)).toBeFalse();
            expect(isNewRound(5, milestones)).toBeFalse();

            // 1 Delegate
            expect(isNewRound(6, milestones)).toBeTrue();
            expect(isNewRound(7, milestones)).toBeTrue();
            expect(isNewRound(8, milestones)).toBeTrue();
            expect(isNewRound(9, milestones)).toBeTrue();

            // 51 Delegates
            expect(isNewRound(10, milestones)).toBeTrue();
            expect(isNewRound(11, milestones)).toBeFalse();
            expect(isNewRound(61, milestones)).toBeTrue();
        });
    });
});
