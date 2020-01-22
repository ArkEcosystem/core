import "jest-extended";

import { Container, TransactionPool } from "@arkecosystem/core-interfaces";
import { setUpFull, tearDownFull } from "./__support__/setup";
import { dynamicFeeTxs, lowFeeTxs } from "./fixtures/transactions";

let container: Container.IContainer;
let processor: TransactionPool.IProcessor;
let transactionPool: TransactionPool.IConnection;

beforeAll(async () => {
    container = await setUpFull();
    transactionPool = container.resolvePlugin("transaction-pool");
});

afterAll(async () => {
    await container.resolvePlugin("database").reset();
    await tearDownFull();
});

beforeEach(() => {
    transactionPool.flush();
    processor = transactionPool.makeProcessor();
});

const dynamicTestFixtures = Object.entries(dynamicFeeTxs);
const lowFeeTestFixtures = Object.entries(lowFeeTxs);
describe("Transaction Guard", () => {
    describe("validate", () => {
        it.each(lowFeeTestFixtures)(
            "should generate ERR_LOW_FEE error for %s when fee is below minimum dynamic fee",
            async (_, transactionInstance) => {
                await processor.validate([transactionInstance.data]);
                const errors = processor.getErrors();
                expect(errors[transactionInstance.id]).toContainEqual({
                    message: "The fee is too low to broadcast and accept the transaction",
                    type: "ERR_LOW_FEE",
                });
            },
        );

        it.each(dynamicTestFixtures)(
            "should not generate ERR_LOW_FEE error for %s when fee is higher than minimum dynamic fee",
            async (_, transactionInstance) => {
                await processor.validate([transactionInstance.data]);
                const errors = processor.getErrors();
                expect(errors[transactionInstance.id]).not.toContainEqual({
                    message: "The fee is too low to broadcast and accept the transaction",
                    type: "ERR_LOW_FEE",
                });
            },
        );
    });
});
