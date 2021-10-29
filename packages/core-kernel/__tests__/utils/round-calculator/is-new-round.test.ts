import "jest-extended";

import { Managers } from "@arkecosystem/crypto";
import { isNewRound } from "@packages/core-kernel/src/utils/round-calculator";

describe("Round Calculator", () => {
    describe("isNewRound", () => {
        const setMilestones = (milestones) => {
            Managers.configManager.set("milestones", milestones);

            Managers.configManager.getMilestone = jest.fn().mockImplementation((height) => {
                for (let i = milestones.length - 1; i >= 0; i--) {
                    if (milestones[i].height <= height) {
                        return milestones[i];
                    }
                }

                return milestones[0];
            });
        };

        it("should determine the beginning of a new round", () => {
            expect(isNewRound(1)).toBeTrue();
            expect(isNewRound(2)).toBeFalse();
            expect(isNewRound(52)).toBeTrue();
            expect(isNewRound(53)).toBeFalse();
            expect(isNewRound(54)).toBeFalse();
            expect(isNewRound(103)).toBeTrue();
            expect(isNewRound(104)).toBeFalse();
            expect(isNewRound(154)).toBeTrue();
        });

        it("should be ok when changing delegate count", () => {
            const milestones = [
                { height: 1, activeDelegates: 2 }, // R1
                { height: 3, activeDelegates: 3 }, // R2
                { height: 6, activeDelegates: 1 }, // R3
                { height: 10, activeDelegates: 51 }, // R7
                { height: 62, activeDelegates: 51 }, // R8
            ];

            setMilestones(milestones);

            // 2 Delegates
            expect(isNewRound(1)).toBeTrue();
            expect(isNewRound(2)).toBeFalse();

            // 3 Delegates
            expect(isNewRound(3)).toBeTrue();
            expect(isNewRound(4)).toBeFalse();
            expect(isNewRound(5)).toBeFalse();

            // 1 Delegate
            expect(isNewRound(6)).toBeTrue();
            expect(isNewRound(7)).toBeTrue();
            expect(isNewRound(8)).toBeTrue();
            expect(isNewRound(9)).toBeTrue();

            // 51 Delegates
            expect(isNewRound(10)).toBeTrue();
            expect(isNewRound(11)).toBeFalse();
            expect(isNewRound(61)).toBeTrue();
        });
    });
});
