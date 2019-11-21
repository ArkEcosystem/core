import { Managers } from "@arkecosystem/crypto";
import devnetMilestones from "@arkecosystem/crypto/src/networks/devnet/milestones.json";
import mainnetMilestones from "@arkecosystem/crypto/src/networks/mainnet/milestones.json";
import unitnetMilestones from "@arkecosystem/crypto/src/networks/unitnet/milestones.json";
import { getMaxTransactionBytes } from "../../../packages/core-transaction-pool/src/utils";

const store = {
    getLastHeight: () => 1,
};

jest.mock("@arkecosystem/core-container", () => ({
    app: {
        resolvePlugin: () => ({
            getStore: () => store,
        }),
    },
}));

describe("Utils", () => {
    describe("getMaxTransactionBytes", () => {
        it.each([[1], [100000], [1000000000]])(
            "should return maxTransactionBytes from unitnet maxPayload milestones value at height %i",
            async height => {
                Managers.configManager.setFromPreset("unitnet");
                store.getLastHeight = () => height;

                // should give the same value as maxPayload is defined at height 1 and never changed
                expect(getMaxTransactionBytes()).toBe(unitnetMilestones[0].block.maxPayload - 10 * 1024);
            },
        );

        it.each([[1, 0], [21600, 2], [910000, 3]])(
            "should return maxTransactionBytes from devnet maxPayload milestones value at height %i",
            async (height, milestonesIndex) => {
                Managers.configManager.setFromPreset("devnet");
                store.getLastHeight = () => height;

                // should give the same value as maxPayload is defined at height 1 and never changed
                expect(getMaxTransactionBytes()).toBe(devnetMilestones[milestonesIndex].block.maxPayload - 10 * 1024);
            },
        );

        it.each([[1, 0], [6600000, 2], [8128000, 2], [9000000, 2]])(
            "should return maxTransactionBytes from mainnet maxPayload milestones value at height %i",
            async (height, milestonesIndex) => {
                Managers.configManager.setFromPreset("mainnet");
                store.getLastHeight = () => height;

                // should give the same value as maxPayload is defined at height 1 and never changed
                expect(getMaxTransactionBytes()).toBe(mainnetMilestones[milestonesIndex].block.maxPayload - 10 * 1024);
            },
        );
    });
});
