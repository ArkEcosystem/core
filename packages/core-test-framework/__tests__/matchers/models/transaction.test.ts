import "@packages/core-test-framework/src/matchers/models/transaction";

let transaction: any;

beforeEach(() => {
    transaction = {
        id: "7e092fd18caa1b57c9df7dfd066883a5fc50fd89dffae4920c119f33a47abf88",
        version: 2, // TODO: Why is not checked in matcher
        type: 0,
        // typeGroup: 1, // TODO: Why is not checked in matcher
        amount: "379990000000",
        fee: "10000000",
        signature:
            "3045022100f1a6076cf97823ce28f9c3de07806150e2c5280101bfdee841949f328f1b1b010220408c6c47caba417c55cbfea15d80da6da591176bab42eca9b20f49594e5924a8",
        timestamp: {
            epoch: 94756144,
            unix: 1584857344,
            human: "2020-03-22T06:09:04.000Z",
        },
    };
});

describe("Transaction", () => {
    describe("toBeTransaction", () => {
        it("should be transaction", async () => {
            expect(transaction).toBeTransaction();
        });

        it("should be transaction -  additional field", async () => {
            transaction.test = {};
            expect(transaction).toBeTransaction();
        });

        it("should not be transaction - missing field", async () => {
            delete transaction.signature;
            expect(transaction).not.toBeTransaction();
        });
    });
});
