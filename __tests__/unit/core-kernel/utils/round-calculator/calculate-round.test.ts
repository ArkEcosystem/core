import "jest-extended";

import { Managers } from "@arkecosystem/crypto";
import { calculateRound, isNewRound } from "@packages/core-kernel/src/utils/round-calculator";

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

                const anotherTestVector = [
                    // { height: 1, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 2 },
                    { height: 2, round: 1, roundHeight: 1, nextRound: 2, activeDelegates: 2 },
                    // { height: 3, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 3 },
                    { height: 4, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 3 },
                    { height: 5, round: 2, roundHeight: 3, nextRound: 3, activeDelegates: 3 },
                    // { height: 6, round: 3, roundHeight: 6, nextRound: 4, activeDelegates: 1 },
                    { height: 7, round: 4, roundHeight: 7, nextRound: 5, activeDelegates: 1 },
                    { height: 9, round: 6, roundHeight: 9, nextRound: 7, activeDelegates: 1 },
                    // { height: 10, round: 7, roundHeight: 10, nextRound: 7, activeDelegates: 51 },
                    { height: 60, round: 7, roundHeight: 10, nextRound: 8, activeDelegates: 51 },
                    { height: 61, round: 8, roundHeight: 61, nextRound: 8, activeDelegates: 51 },
                ];

                const milestones = testVector.reduce((acc, vector) => acc.set(vector.height, vector), new Map());

                Managers.configManager.set("milestones", [...milestones.values()]);

                Managers.configManager.getMilestone = jest.fn().mockImplementation((height) => milestones.get(height));

                testVector
                    .concat(anotherTestVector)
                    .forEach(({ height, round, roundHeight, nextRound, activeDelegates }) => {
                        const result = calculateRound(height);
                        expect(result.round).toBe(round);
                        expect(result.roundHeight).toBe(roundHeight);
                        expect(isNewRound(result.roundHeight)).toBeTrue();
                        expect(result.nextRound).toBe(nextRound);
                        expect(result.maxDelegates).toBe(activeDelegates);
                    });
            });

            it("should throw if active delegates is not changed on new round", () => {
                const testVector = [
                    { height: 1, round: 1, roundHeight: 1, nextRound: 1, activeDelegates: 3 },
                    { height: 3, round: 2, roundHeight: 3, nextRound: 2, activeDelegates: 4 },
                ];

                const milestones = testVector.reduce((acc, vector) => acc.set(vector.height, vector), new Map());

                Managers.configManager.set("milestones", [...milestones.values()]);

                Managers.configManager.getMilestone = jest.fn().mockImplementation((height) => milestones.get(height));

                calculateRound(1);
                calculateRound(2);
                expect(() => calculateRound(3)).toThrowError();
            });
        });
    });
});
