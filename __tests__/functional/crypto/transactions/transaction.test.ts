import { Managers, Transactions, Identities } from "../../../../packages/crypto/src";

describe("Transaction", () => {
    describe("toString", () => {
        it("should describe v1 transaction", () => {
            Managers.configManager.getMilestone().aip11 = false;

            const senderAddress = Identities.Address.fromPassphrase("sender's secret");
            const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
            const transaction = Transactions.BuilderFactory.transfer()
                .version(1)
                .amount("100")
                .recipientId(recipientAddress)
                .sign("sender's secret")
                .build();

            expect(String(transaction)).toMatch(new RegExp(`^${senderAddress} transfer v1 [0-9a-f]{64}$`));
        });

        it("should describe v2 transaction", () => {
            Managers.configManager.getMilestone().aip11 = true;

            const senderAddress = Identities.Address.fromPassphrase("sender's secret");
            const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
            const transaction = Transactions.BuilderFactory.transfer()
                .version(2)
                .amount("100")
                .recipientId(recipientAddress)
                .nonce("1")
                .sign("sender's secret")
                .build();

            expect(String(transaction)).toMatch(new RegExp(`^${senderAddress} #1 transfer v2 [0-9a-f]{64}$`));
        });
    });
});
