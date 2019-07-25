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

    it("should accept transactions matching the static fee for broadcast", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).broadcast).toBeTrue();
    });

    it("should accept transactions matching the static fee to enter pool", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).enterPool).toBeTrue();
    });

    it("should not broadcast transactions with a fee other than the static fee", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).broadcast).toBeFalse();
    });

    it("should not allow transactions with a fee other than the static fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeFalse();
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

    it.only("should broadcast transactions with high enough fee", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).broadcast).toBeTrue();

        const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
            transactions.dynamicFeeNormalDummy1.key
        ];

        const handler = Handlers.Registry.get(transactions.dummy1.type);
        transactions.dynamicFeeNormalDummy1.data.fee = handler
            .dynamicFee(transactions.dynamicFeeNormalDummy1, addonBytes, dynamicFeeConfig.minFeeBroadcast)
            .plus(100);

        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).broadcast).toBeTrue();

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
        expect(dynamicFeeMatcher(transactions.dummy3).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy4).broadcast).toBeTrue();
    });

    it("should accept transactions with high enough fee to enter the pool", () => {
        const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
            transactions.dynamicFeeNormalDummy1.key
        ];

        const handler = Handlers.Registry.get(transactions.dummy1.type);

        expect(dynamicFeeMatcher(transactions.dummy1).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).enterPool).toBeTrue();

        transactions.dynamicFeeNormalDummy1.data.fee = handler
            .dynamicFee(transactions.dynamicFeeNormalDummy1, addonBytes, dynamicFeeConfig.minFeePool)
            .plus(100);

        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeTrue();

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
        expect(dynamicFeeMatcher(transactions.dummy3).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy4).enterPool).toBeTrue();
    });

    it("should not broadcast transactions with too low fee", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2).broadcast).toBeFalse();
    });

    it("should not allow transactions with too low fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2).enterPool).toBeFalse();
    });
});
