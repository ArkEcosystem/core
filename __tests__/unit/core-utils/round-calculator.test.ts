import "jest-extended";
import "./mocks/core-container";

import { app } from "@arkecosystem/core-container";
import { calculateRound, isNewRound } from "../../../packages/core-utils/src/round-calculator";

describe("Round calculator", () => {
    describe("calculateRound", () => {
        it("should calculate the round when nextRound is the same", () => {
            for (let i = 0, height = 51; i < 1000; i++, height += 51) {
                const { round, nextRound } = calculateRound(height - 1);
                expect(round).toBe(i + 1);
                expect(nextRound).toBe(i + 1);
            }
        });

        it("should calculate the round when nextRound is not the same", () => {
            for (let i = 0, height = 51; i < 1000; i++, height += 51) {
                const { round, nextRound } = calculateRound(height);
                expect(round).toBe(i + 1);
                expect(nextRound).toBe(i + 2);
            }
        });

        it("should calculate the correct round", () => {
            const activeDelegates = 51;
            for (let i = 0; i < 1000; i++) {
                const { round, nextRound } = calculateRound(i + 1);
                expect(round).toBe(Math.floor(i / activeDelegates) + 1);
                expect(nextRound).toBe(Math.floor((i + 1) / activeDelegates) + 1);
            }
        });
    });

    describe("isNewRound", () => {
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
            const milestones = {
                "1": { height: 1, activeDelegates: 2 }, // R1
                "2": { height: 2, activeDelegates: 2 }, // R1
                "3": { height: 3, activeDelegates: 3 }, // R2
                "4": { height: 4, activeDelegates: 3 }, // R2
                "5": { height: 5, activeDelegates: 3 }, // R2
                "6": { height: 6, activeDelegates: 1 }, // R3
                "7": { height: 7, activeDelegates: 1 }, // R4
                "8": { height: 8, activeDelegates: 1 }, // R5
                "9": { height: 9, activeDelegates: 1 }, // R6
                "10": { height: 10, activeDelegates: 51 }, // R7
                "11": { height: 11, activeDelegates: 51 }, // R7
                "61": { height: 61, activeDelegates: 51 }, // R7
                "62": { height: 62, activeDelegates: 51 }, // R8
            };

            app.getConfig = jest.fn(() => {
                return {
                    milestones: Object.values(milestones),
                    getMilestone: height => {
                        return milestones[height];
                    },
                };
            });

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
