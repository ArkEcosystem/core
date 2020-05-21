import "jest-extended";

import { CryptoManager } from "../../../../packages/crypto/src";
import { devnet } from "../../../../packages/crypto/src/networks";
import milestones from "./fixtures/block-time-milestones.json";

let milestoneManagerDevnet;
let heightTrackerDevnet;

beforeAll(() => {
    const devnetCrypto = CryptoManager.createFromPreset("devnet");
    milestoneManagerDevnet = devnetCrypto.MilestoneManager;
    heightTrackerDevnet = devnetCrypto.HeightTracker;
});

describe("MilestoneManager", () => {
    it("should be instantiated", () => {
        expect(milestoneManagerDevnet).toBeObject();
    });

    it("should build milestones", () => {
        expect(milestoneManagerDevnet.getMilestones()).toEqual(devnet.milestones);
    });

    it('should build milestones without concatenating the "minimumVersions" array', () => {
        const milestones = devnet.milestones.sort((a, b) => a.height - b.height);
        heightTrackerDevnet.setHeight(milestones[0].height);

        const lastMilestone = milestones.find((milestone) => !!milestone.p2p && !!milestone.p2p.minimumVersions);

        if (lastMilestone && lastMilestone.p2p && milestoneManagerDevnet.getMilestone().p2p) {
            expect(milestoneManagerDevnet.getMilestone().p2p.minimumVersions).toEqual(
                lastMilestone.p2p.minimumVersions,
            );
        }
    });

    it("should get milestone for height", () => {
        expect(milestoneManagerDevnet.getMilestone(21600)).toEqual(devnet.milestones[2]);
    });

    it("should get milestone for this.height if height is not provided as parameter", () => {
        heightTrackerDevnet.setHeight(21600);

        expect(milestoneManagerDevnet.getMilestone()).toEqual(devnet.milestones[2]);
    });

    it("should determine if a new milestone is becoming active", () => {
        for (const milestone of devnet.milestones) {
            heightTrackerDevnet.setHeight(milestone.height);
            expect(milestoneManagerDevnet.isNewMilestone()).toBeTrue();
        }

        heightTrackerDevnet.setHeight(999999);
        expect(milestoneManagerDevnet.isNewMilestone()).toBeFalse();

        heightTrackerDevnet.setHeight(1);
        expect(milestoneManagerDevnet.isNewMilestone(999999)).toBeFalse();
    });

    describe("BlockTimeCalculator", () => {
        beforeAll(() => {
            // @ts-ignore
            milestoneManagerDevnet.milestones = milestones;
        });

        describe("isNewBlock", () => {
            it("should calculate whether a given round contains a new blocktime", () => {
                expect(milestoneManagerDevnet.isNewBlockTime(1)).toBeTrue();
                expect(milestoneManagerDevnet.isNewBlockTime(10800)).toBeTrue();
                expect(milestoneManagerDevnet.isNewBlockTime(910000)).toBeTrue();
                expect(milestoneManagerDevnet.isNewBlockTime(920000)).toBeTrue();
                expect(milestoneManagerDevnet.isNewBlockTime(950000)).toBeTrue();
            });

            it("should return false is the height is not a new milestone", () => {
                expect(milestoneManagerDevnet.isNewBlockTime(2)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(10799)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(10801)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(960001)).toBeFalse();
            });

            it("should return false when a new milestone doesn't include a new blocktime", async () => {
                expect(milestoneManagerDevnet.isNewBlockTime(21600)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(960000)).toBeFalse();
            });

            it("should return false when the milestone includes the same blocktime", async () => {
                expect(milestoneManagerDevnet.isNewBlockTime(910004)).toBeFalse();
            });
        });

        describe("calculateBlockTime", () => {
            it("should calculate the blocktime from a given height", () => {
                expect(milestoneManagerDevnet.calculateBlockTime(1)).toEqual(8);
                expect(milestoneManagerDevnet.calculateBlockTime(10800)).toEqual(9);
                expect(milestoneManagerDevnet.calculateBlockTime(910000)).toEqual(11);

                expect(milestoneManagerDevnet.calculateBlockTime(950000)).toEqual(12);
            });

            it("should calculate blocktime from the last milestone where it was changes", () => {
                expect(milestoneManagerDevnet.isNewBlockTime(21600)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(900000)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(2)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(10799)).toBeFalse();
                expect(milestoneManagerDevnet.isNewBlockTime(970000)).toBeFalse();

                expect(milestoneManagerDevnet.calculateBlockTime(2)).toEqual(8);
                expect(milestoneManagerDevnet.calculateBlockTime(10799)).toEqual(8);

                expect(milestoneManagerDevnet.calculateBlockTime(21600)).toEqual(9);
                expect(milestoneManagerDevnet.calculateBlockTime(900000)).toEqual(9);
                expect(milestoneManagerDevnet.calculateBlockTime(970000)).toEqual(12);
            });

            it("should calculate blocktimes when they reduce to a previously used blocktime", () => {
                expect(milestoneManagerDevnet.isNewBlockTime(920000)).toBeTrue();

                expect(milestoneManagerDevnet.calculateBlockTime(920000)).toEqual(9);
            });

            it("should calculate latest milestone correctly when it doesn't change the blocktime", () => {
                expect(milestoneManagerDevnet.isNewBlockTime(960000)).toBeFalse();
                expect(milestoneManagerDevnet.calculateBlockTime(960000)).toEqual(12);
            });

            it("should throw an error when no blocktimes are specified in any milestones", () => {
                // @ts-ignore
                milestoneManagerDevnet.milestones = [{}];
                expect(milestoneManagerDevnet.isNewBlockTime(960000)).toBeFalse();
                expect(() => milestoneManagerDevnet.calculateBlockTime(960000)).toThrow(
                    `No milestones specifying any height were found`,
                );
            });
        });
    });
});
