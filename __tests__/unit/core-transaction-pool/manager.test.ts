import "jest-extended";
import { transactionPoolManager } from "../../../packages/core-transaction-pool/src/manager";

class FakeDriver {
    public make() {
        return this;
    }
}

describe("Transaction Pool Manager", () => {
    describe("connection", () => {
        it("should return the drive-connection", async () => {
            await transactionPoolManager.makeConnection(new FakeDriver());

            expect(transactionPoolManager.connection()).toBeInstanceOf(FakeDriver);
        });

        it("should return the drive-connection for a different name", async () => {
            await transactionPoolManager.makeConnection(new FakeDriver(), "testing");

            expect(transactionPoolManager.connection("testing")).toBeInstanceOf(FakeDriver);
        });
    });
});
