import { dynamicFeeMatcher } from "../src/utils/dynamicfee-matcher";
import { transactions } from "./__fixtures__/transactions";
import { setUpFull, tearDown } from "./__support__/setup";

let blockchain;
let container;

beforeAll(async () => {
    container = await setUpFull();
});

afterAll(async () => {
    await tearDown();
});

describe("static fees", () => {
    beforeAll(() => {
        blockchain = container.resolvePlugin("blockchain");
        blockchain.getLastBlock = jest.fn(plugin => ({
            data: {
                height: 20,
            },
        }));
        const h = blockchain.getLastBlock().data.height;
        container.resolvePlugin("config").getConstants(h).fees.dynamic = false;
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
        expect(dynamicFeeMatcher(transactions.dynamicFeeZero).broadcast).toBeFalse();
    });

    it("should not allow transactions with a fee other than the static fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeFalse();
        expect(dynamicFeeMatcher(transactions.dynamicFeeZero).enterPool).toBeFalse();
    });
});

describe("dynamic fees", () => {
    beforeAll(() => {
        blockchain = container.resolvePlugin("blockchain");
        blockchain.getLastBlock = jest.fn(plugin => ({
            data: {
                height: 20,
            },
        }));
        const h = blockchain.getLastBlock().data.height;
        container.resolvePlugin("config").getConstants(h).fees.dynamic = true;
    });

    it("should broadcast transactions with high enough fee", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).broadcast).toBeTrue();
    });

    it("should accept transactions with high enough fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeTrue();
    });

    it("should not broadcast transactions with too low fee", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2).broadcast).toBeFalse();
        expect(dynamicFeeMatcher(transactions.dynamicFeeZero).broadcast).toBeFalse();
    });

    it("should not allow transactions with too low fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dynamicFeeLowDummy2).enterPool).toBeFalse();
        expect(dynamicFeeMatcher(transactions.dynamicFeeZero).enterPool).toBeFalse();
    });
});
