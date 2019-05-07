import "jest-extended";
import "./mocks/core-container";

import { app } from "@arkecosystem/core-container";
import { calculateRound, isNewRound } from "../../../packages/core-utils/src/round-calculator";

describe("Round calculator", () => {
    describe("calculateRound", () => {
        describe("static delegate count", () => {
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

        describe("dynamic delegate count", () => {
            it("should calculate the correct with dynamic delegate count", () => {
                const testVector = [
                    { height: 1, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 2 },
                    { height: 3, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 3 },
                    { height: 6, round: 3, roundHeight: 6, nextRound: 4, activeDelegates: 1 },
                    { height: 10, round: 7, roundHeight: 10, nextRound: 7, activeDelegates: 51 },
                    { height: 112, round: 9, roundHeight: 112, nextRound: 10, activeDelegates: 1 },
                    { height: 115, round: 12, roundHeight: 115, nextRound: 12, activeDelegates: 2 },
                    { height: 131, round: 20, roundHeight: 131, nextRound: 20, activeDelegates: 51 },
                ];

                const milestones = testVector.reduce((acc, vector) => acc.set(vector.height, vector), new Map());

                const backup = app.getConfig;
                app.getConfig = jest.fn(() => {
                    return {
                        config: {
                            milestones: Array.from(milestones.values()),
                        },
                        getMilestone: height => {
                            return milestones.get(height);
                        },
                    };
                });

                testVector.forEach(({ height, round, roundHeight, nextRound, activeDelegates }) => {
                    const result = calculateRound(height);
                    expect(result.round).toBe(round);
                    expect(result.roundHeight).toBe(roundHeight);
                    expect(isNewRound(result.roundHeight)).toBeTrue();
                    expect(result.nextRound).toBe(nextRound);
                    expect(result.maxDelegates).toBe(activeDelegates);
                });

                app.getConfig = backup;
            });
        });
    });

    describe("isNewRound", () => {
        const setMilestones = milestones => {
            app.getConfig = jest.fn(() => {
                return {
                    config: {
                        milestones,
                    },
                    getMilestone: height => {
                        for (let i = milestones.length - 1; i >= 0; i--) {
                            if (milestones[i].height <= height) {
                                return milestones[i];
                            }
                        }

                        return milestones[0];
                    },
                };
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

            const backup = app.getConfig;
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

            app.getConfig = backup;
        });
    });
});
