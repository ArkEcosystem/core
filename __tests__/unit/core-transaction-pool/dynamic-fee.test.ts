import { container } from "./mocks/core-container";

import { Handlers } from "@arkecosystem/core-transactions/src";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { dynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee";
import { transactions } from "./__fixtures__/transactions";

describe("static fees", () => {
    beforeEach(() => {
        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...defaults,
            ...{ dynamicFees: { enabled: false } },
        });
    });

    it("should accept transactions matching the static fee for broadcast", async () => {
        await expect(dynamicFeeMatcher(transactions.dummy1)).resolves.toHaveProperty("broadcast", true);
        await expect(dynamicFeeMatcher(transactions.dummy2)).resolves.toHaveProperty("broadcast", true);
    });

    it("should accept transactions matching the static fee to enter pool", async () => {
        await expect(dynamicFeeMatcher(transactions.dummy1)).resolves.toHaveProperty("enterPool", true);
        await expect(dynamicFeeMatcher(transactions.dummy2)).resolves.toHaveProperty("enterPool", true);
    });

    it("should not broadcast transactions with a fee other than the static fee", async () => {
        await expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1)).resolves.toHaveProperty(
            "broadcast",
            false,
        );
    });

    it("should not allow transactions with a fee other than the static fee to enter the pool", async () => {
        await expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1)).resolves.toHaveProperty(
            "enterPool",
            false,
        );
    });
});

describe("dynamic fees", () => {
    const dynamicFeeConfig = defaults.dynamicFees;

    beforeEach(() => {
        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...defaults,
            ...{ dynamicFees: { ...defaults.dynamicFees, ...{ enabled: true } } },
        });
    });

    it("should broadcast transactions with high enough fee", async () => {
        await expect(dynamicFeeMatcher(transactions.dummy1)).resolves.toHaveProperty("broadcast", true);
        await expect(dynamicFeeMatcher(transactions.dummy2)).resolves.toHaveProperty("broadcast", true);

        const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
            transactions.dynamicFeeNormalDummy1.key
        ];

        const handler = await Handlers.Registry.get(transactions.dummy1.type);
        transactions.dynamicFeeNormalDummy1.data.fee = handler
            .dynamicFee(transactions.dynamicFeeNormalDummy1, addonBytes, dynamicFeeConfig.minFeeBroadcast)
            .plus(100);

        await expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1)).resolves.toHaveProperty("broadcast", true);

        // testing with transaction fee === min fee for transaction broadcast
        transactions.dummy3.data.fee = handler.dynamicFee(
            transactions.dummy3,
            addonBytes,
            dynamicFeeConfig.minFeeBroadcast,
        );
        transactions.dummy4.data.fee = handler.dynamicFee(
            transactions.dummy4,
            addonBytes,
            dynamicFeeConfig.minFeeBroadcast,
        );
        await expect(dynamicFeeMatcher(transactions.dummy3)).resolves.toHaveProperty("broadcast", true);
        await expect(dynamicFeeMatcher(transactions.dummy4)).resolves.toHaveProperty("broadcast", true);
    });

    it("should accept transactions with high enough fee to enter the pool", async () => {
        const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
            transactions.dynamicFeeNormalDummy1.key
        ];

        const handler = await Handlers.Registry.get(transactions.dummy1.type);

        await expect(dynamicFeeMatcher(transactions.dummy1)).resolves.toHaveProperty("enterPool", true);
        await expect(dynamicFeeMatcher(transactions.dummy2)).resolves.toHaveProperty("enterPool", true);

        transactions.dynamicFeeNormalDummy1.data.fee = handler
            .dynamicFee(transactions.dynamicFeeNormalDummy1, addonBytes, dynamicFeeConfig.minFeePool)
            .plus(100);

        await expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1)).resolves.toHaveProperty("enterPool", true);

        // testing with transaction fee === min fee for transaction enter pool
        transactions.dummy3.data.fee = handler.dynamicFee(
            transactions.dummy3,
            addonBytes,
            dynamicFeeConfig.minFeeBroadcast,
        );
        transactions.dummy4.data.fee = handler.dynamicFee(
            transactions.dummy4,
            addonBytes,
            dynamicFeeConfig.minFeeBroadcast,
        );
        await expect(dynamicFeeMatcher(transactions.dummy3)).resolves.toHaveProperty("enterPool", true);
        await expect(dynamicFeeMatcher(transactions.dummy4)).resolves.toHaveProperty("enterPool", true);
    });

    it("should not broadcast transactions with too low fee", async () => {
        await expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2)).resolves.toHaveProperty("broadcast", false);
    });

    it("should not allow transactions with too low fee to enter the pool", async () => {
        await expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2)).resolves.toHaveProperty("enterPool", false);
    });
});
