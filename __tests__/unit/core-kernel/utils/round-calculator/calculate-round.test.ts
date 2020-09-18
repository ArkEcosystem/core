import "jest-extended";

import { calculateRound, isNewRound } from "@packages/core-kernel/src/utils/round-calculator";
import { Errors, Managers } from "@packages/crypto";
import { devnet } from "@packages/crypto/src/networks";

describe("Round Calculator", () => {
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

            it("should calculate correct round for each height in round", () => {
                const milestones = [{ height: 1, activeDelegates: 4 }];

                const config = { ...devnet, milestones };
                Managers.configManager.setConfig(config);

                const testVector = [
                    // Round 1
                    { height: 1, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 4 },
                    { height: 2, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 4 },
                    { height: 3, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 4 },
                    { height: 4, round: 1, roundHeight: 1, nextRound: 2, activeDelegates: 4 },
                    // Round 2
                    { height: 5, round: 2, roundHeight: 5, nextRound: 2, activeDelegates: 4 },
                    { height: 6, round: 2, roundHeight: 5, nextRound: 2, activeDelegates: 4 },
                    { height: 7, round: 2, roundHeight: 5, nextRound: 2, activeDelegates: 4 },
                    { height: 8, round: 2, roundHeight: 5, nextRound: 3, activeDelegates: 4 },
                    // Round 3
                    { height: 9, round: 3, roundHeight: 9, nextRound: 3, activeDelegates: 4 },
                    { height: 10, round: 3, roundHeight: 9, nextRound: 3, activeDelegates: 4 },
                    { height: 11, round: 3, roundHeight: 9, nextRound: 3, activeDelegates: 4 },
                    { height: 12, round: 3, roundHeight: 9, nextRound: 4, activeDelegates: 4 },
                ];

                testVector.forEach((item) => {
                    const result = calculateRound(item.height);
                    expect(result.round).toBe(item.round);
                    expect(result.roundHeight).toBe(item.roundHeight);
                    expect(isNewRound(result.roundHeight)).toBeTrue();
                    expect(result.nextRound).toBe(item.nextRound);
                    expect(result.maxDelegates).toBe(item.activeDelegates);
                });
            });
        });

        describe("dynamic delegate count", () => {
            it("should calculate the correct with dynamic delegate count", () => {
                const milestones = [
                    { height: 1, activeDelegates: 2 },
                    { height: 3, activeDelegates: 3 },
                    { height: 9, activeDelegates: 1 },
                    { height: 12, activeDelegates: 3 },
                ];

                const testVector = [
                    // Round 1 - milestone
                    { height: 1, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 2 },
                    { height: 2, round: 1, roundHeight: 1, nextRound: 2, activeDelegates: 2 },
                    // Round 2 - milestone change
                    { height: 3, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 3 },
                    { height: 4, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 3 },
                    { height: 5, round: 2, roundHeight: 3, nextRound: 3, activeDelegates: 3 },
                    // Round 3
                    { height: 6, round: 3, roundHeight: 6, nextRound: 3, activeDelegates: 3 },
                    { height: 7, round: 3, roundHeight: 6, nextRound: 3, activeDelegates: 3 },
                    { height: 8, round: 3, roundHeight: 6, nextRound: 4, activeDelegates: 3 },
                    // Round 4 - 6 - milestone change
                    { height: 9, round: 4, roundHeight: 9, nextRound: 5, activeDelegates: 1 },
                    { height: 10, round: 5, roundHeight: 10, nextRound: 6, activeDelegates: 1 },
                    { height: 11, round: 6, roundHeight: 11, nextRound: 7, activeDelegates: 1 },
                    // Round 7 - milestone change
                    { height: 12, round: 7, roundHeight: 12, nextRound: 7, activeDelegates: 3 },
                    { height: 13, round: 7, roundHeight: 12, nextRound: 7, activeDelegates: 3 },
                    { height: 14, round: 7, roundHeight: 12, nextRound: 8, activeDelegates: 3 },
                    // Round 8
                    { height: 15, round: 8, roundHeight: 15, nextRound: 8, activeDelegates: 3 },
                ];

                const config = { ...devnet, milestones };
                Managers.configManager.setConfig(config);

                testVector.forEach(({ height, round, roundHeight, nextRound, activeDelegates }) => {
                    const result = calculateRound(height);
                    expect(result.round).toBe(round);
                    expect(result.roundHeight).toBe(roundHeight);
                    expect(isNewRound(result.roundHeight)).toBeTrue();
                    expect(result.nextRound).toBe(nextRound);
                    expect(result.maxDelegates).toBe(activeDelegates);
                });
            });

            it("should throw if active delegates is not changed on new round", () => {
                const milestones = [
                    { height: 1, activeDelegates: 3 },
                    { height: 3, activeDelegates: 4 }, // Next milestone should be 4
                ];

                // @ts-ignore
                Managers.configManager.validateMilestones = jest.fn();

                const config = { ...devnet, milestones };
                Managers.configManager.setConfig(config);

                calculateRound(1);
                calculateRound(2);
                expect(() => calculateRound(3)).toThrowError(Errors.InvalidMilestoneConfigurationError);
            });
        });
    });
});
