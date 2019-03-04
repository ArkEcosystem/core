import "../../../../packages/core-jest-matchers/src/api/transaction";

const transaction = {
    id: "",
    blockid: "",
    type: "",
    timestamp: "",
    amount: "",
    fee: "",
    senderId: "",
    senderPublicKey: "",
    signature: "",
    asset: "",
    confirmations: "",
};

describe(".toBeApiTransaction", () => {
    test("passes pass given a valid transaction", () => {
        expect(transaction).toBeApiTransaction();
    });

    test("fails given an invalid transaction", () => {
        delete transaction.id;
        expect(expect(transaction).toBeApiTransaction).toThrowError(/Expected .* to be a valid transaction/);
    });
});
