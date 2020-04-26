import "@packages/core-test-framework/src/matchers/api/transaction";

let transaction: any;

beforeEach(() => {
    transaction = {
        id: "7e092fd18caa1b57c9df7dfd066883a5fc50fd89dffae4920c119f33a47abf88",
        blockId: "2530484368cab52faaa08a6cf218faf2911a8bac29584dbf5f71e290e88461da",
        version: 2,
        type: 0,
        typeGroup: 1,
        amount: "379990000000",
        fee: "10000000",
        senderId: "AagVinotZRfT5Xw57baQQBLvALdhAGeBfw",
        senderPublicKey: "03a550364f50f0710a7e4d27bf6542f37765b846923b84fab07a7c2f161106e73c",
        recipient: "AFrPtEmzu6wdVpa2CnRDEKGQQMWgq8nE9V",
        signature:
            "3045022100f1a6076cf97823ce28f9c3de07806150e2c5280101bfdee841949f328f1b1b010220408c6c47caba417c55cbfea15d80da6da591176bab42eca9b20f49594e5924a8",
        confirmations: 25,
        timestamp: {
            epoch: 94756144,
            unix: 1584857344,
            human: "2020-03-22T06:09:04.000Z",
        },
        asset: {},
        nonce: "54",
    };
});

describe("Transaction", () => {
    describe("toBeApiTransaction", () => {
        it("should be valid transaction", async () => {
            expect(transaction).toBeApiTransaction();
        });

        it("should not be valid transaction", async () => {
            delete transaction.asset;
            expect(transaction).not.toBeApiTransaction();
        });
    });
});
