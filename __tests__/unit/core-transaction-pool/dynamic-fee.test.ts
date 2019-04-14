import { container } from "./mocks/core-container";

import { Utils } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { calculateFee, dynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee";
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

    it("should broadcast transactions with high enough fee", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).broadcast).toBeTrue();

        transactions.dynamicFeeNormalDummy1.data.fee = calculateFee(
            dynamicFeeConfig.minFeeBroadcast,
            transactions.dynamicFeeNormalDummy1,
        ).plus(100);
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).broadcast).toBeTrue();

        // testing with transaction fee === min fee for transaction broadcast
        transactions.dummy3.data.fee = calculateFee(dynamicFeeConfig.minFeeBroadcast, transactions.dummy3);
        transactions.dummy4.data.fee = calculateFee(dynamicFeeConfig.minFeeBroadcast, transactions.dummy4);
        expect(dynamicFeeMatcher(transactions.dummy3).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy4).broadcast).toBeTrue();
    });

    it("should accept transactions with high enough fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).enterPool).toBeTrue();

        transactions.dynamicFeeNormalDummy1.data.fee = calculateFee(
            dynamicFeeConfig.minFeePool,
            transactions.dynamicFeeNormalDummy1,
        ).plus(100);
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeTrue();

        // testing with transaction fee === min fee for transaction enter pool
        transactions.dummy3.data.fee = calculateFee(dynamicFeeConfig.minFeePool, transactions.dummy3);
        transactions.dummy4.data.fee = calculateFee(dynamicFeeConfig.minFeePool, transactions.dummy4);
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

describe("calculateFee", () => {
    it("should correctly calculate the transaction fee based on transaction size and addonBytes", () => {
        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...defaults,
            ...{ dynamicFees: { addonBytes: { transfer: 137 } } },
        });

        expect(calculateFee(3, transactions.dummy1)).toEqual(
            Utils.BigNumber.make(137 + transactions.dummy1.serialized.length / 2).times(3),
        );
        expect(calculateFee(6, transactions.dummy1)).toEqual(
            Utils.BigNumber.make(137 + transactions.dummy1.serialized.length / 2).times(6),
        );

        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...defaults,
            ...{ dynamicFees: { addonBytes: { transfer: 0 } } },
        });

        expect(calculateFee(9, transactions.dummy1)).toEqual(
            Utils.BigNumber.make(transactions.dummy1.serialized.length / 2).times(9),
        );
    });

    it("should default satoshiPerByte to 1 if value provided is <= 0", () => {
        expect(calculateFee(-50, transactions.dummy1)).toEqual(calculateFee(1, transactions.dummy1));
        expect(calculateFee(0, transactions.dummy1)).toEqual(calculateFee(1, transactions.dummy1));
    });
});
