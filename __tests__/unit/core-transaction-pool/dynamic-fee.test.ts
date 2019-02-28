import { Blockchain, Container } from "@arkecosystem/core-interfaces";
import { calculateFee, dynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee";
import { transactions } from "./__fixtures__/transactions";
import { setUpFull, tearDownFull } from "./__support__/setup";

let config;
let blockchain: Blockchain.IBlockchain;
let container: Container.IContainer;

beforeAll(async () => {
    container = await setUpFull();

    config = require("../../../packages/core-transaction-pool/src").config;
    config.init(container.resolveOptions("transactionPool"));
    blockchain = container.resolvePlugin<Blockchain.IBlockchain>("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

describe("static fees", () => {
    beforeAll(() => {
        // @ts-ignore
        blockchain.getLastBlock = jest.fn(plugin => ({
            data: {
                height: 20,
            },
        }));

        config.set("dynamicFees.enabled", false);
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
    let dynFeeConfig;
    beforeAll(() => {
        // @ts-ignore
        blockchain.getLastBlock = jest.fn(plugin => ({
            data: {
                height: 20,
            },
        }));

        config.set("dynamicFees.enabled", true);

        dynFeeConfig = config.get("dynamicFees");
    });

    it("should broadcast transactions with high enough fee", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).broadcast).toBeTrue();

        // testing with transaction fee === min fee for transaction broadcast
        transactions.dummy3.fee = calculateFee(dynFeeConfig.minFeeBroadcast, transactions.dummy3);
        transactions.dummy4.fee = calculateFee(dynFeeConfig.minFeeBroadcast, transactions.dummy4);
        expect(dynamicFeeMatcher(transactions.dummy3).broadcast).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy4).broadcast).toBeTrue();
    });

    it("should accept transactions with high enough fee to enter the pool", () => {
        expect(dynamicFeeMatcher(transactions.dummy1).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dummy2).enterPool).toBeTrue();
        expect(dynamicFeeMatcher(transactions.dynamicFeeNormalDummy1).enterPool).toBeTrue();

        // testing with transaction fee === min fee for transaction enter pool
        transactions.dummy3.fee = calculateFee(dynFeeConfig.minFeePool, transactions.dummy3);
        transactions.dummy4.fee = calculateFee(dynFeeConfig.minFeePool, transactions.dummy4);
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
        config.set("dynamicFees.addonBytes", {
            transfer: 137,
        });
        expect(calculateFee(3, transactions.dummy1)).toBe((137 + transactions.dummy1.serialized.length / 2) * 3);
        expect(calculateFee(6, transactions.dummy1)).toBe((137 + transactions.dummy1.serialized.length / 2) * 6);

        config.set("dynamicFees.addonBytes", {
            transfer: 0,
        });
        expect(calculateFee(9, transactions.dummy1)).toBe((transactions.dummy1.serialized.length / 2) * 9);
    });

    it("should default satoshiPerByte to 1 if value provided is <= 0", () => {
        expect(calculateFee(-50, transactions.dummy1)).toBe(calculateFee(1, transactions.dummy1));
        expect(calculateFee(0, transactions.dummy1)).toBe(calculateFee(1, transactions.dummy1));
    });
});
