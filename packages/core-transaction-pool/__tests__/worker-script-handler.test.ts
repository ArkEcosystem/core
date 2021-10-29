import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Generators } from "@packages/core-test-framework";
import { WorkerScriptHandler } from "@packages/core-transaction-pool/src/worker-script-handler";
import { Identities, Managers, Transactions } from "@packages/crypto";

describe("WorkerScriptHandler.loadCryptoPackage", () => {
    it("should register crypto package transactions", () => {
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.loadCryptoPackage("@arkecosystem/core-magistrate-crypto");
        const check = () => {
            Transactions.TransactionRegistry.registerTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
        };
        expect(check).toThrow("Transaction type BusinessRegistrationTransaction is already registered.");
    });
});

describe("WorkerScriptHandler.setConfig", () => {
    it("should set crypto configuration", () => {
        const config = Generators.generateCryptoConfigRaw();
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.setConfig(config);
        expect(Managers.configManager.get("genesisBlock.payloadHash")).toBe(config.genesisBlock.payloadHash);
    });
});

describe("WorkerScriptHandler.setHeight", () => {
    it("should set height", () => {
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.setHeight(100);
        expect(Managers.configManager.getHeight()).toBe(100);
    });
});

describe("WorkerScriptHandler.getTransactionFromData", () => {
    it("should return serialized transaction and its id", async () => {
        const workerScriptHandler = new WorkerScriptHandler();

        const transaction = Transactions.BuilderFactory.transfer()
            .version(2)
            .amount("100")
            .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("1")
            .sign("sender's secret")
            .build();
        const result = await workerScriptHandler.getTransactionFromData(transaction.data);

        expect(result).toEqual({
            id: transaction.id,
            serialized: transaction.serialized.toString("hex"),
            isVerified: true,
        });
    });
});
