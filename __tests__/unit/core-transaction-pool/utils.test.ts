import { Managers } from "@arkecosystem/crypto";
import unitnetMilestones from "@arkecosystem/crypto/src/networks/unitnet/milestones.json";
import { getMaxTransactionBytes } from "../../../packages/core-transaction-pool/src/utils";

jest.mock("@arkecosystem/core-container", () => ({
    app: {
        resolvePlugin: () => ({
            getStore: () => ({
                getLastHeight: () => 1,
            }),
        }),
    },
}));

describe("Utils", () => {
    describe("getMaxTransactionBytes", () => {
        it("should return maxTransactionBytes from maxPayload milestones value", async () => {
            Managers.configManager.setFromPreset("unitnet");

            expect(getMaxTransactionBytes()).toBe(unitnetMilestones[0].block.maxPayload - 10 * 1024);
        });
    });
});
