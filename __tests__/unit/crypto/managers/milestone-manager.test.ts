import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { devnet } from "../../../../packages/crypto/src/networks";

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
});
