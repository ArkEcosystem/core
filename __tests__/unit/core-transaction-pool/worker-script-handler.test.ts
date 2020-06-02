import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Generators } from "@arkecosystem/core-test-framework/src";

import { CryptoSuite } from "../../../packages/core-crypto";
import { WorkerScriptHandler } from "../../../packages/core-transaction-pool/src/worker-script-handler";

const crypto = new CryptoSuite.CryptoSuite(Generators.generateCryptoConfigRaw());
crypto.CryptoManager.HeightTracker.setHeight(2);

describe("WorkerScriptHandler.loadCryptoPackage", () => {
    it("should register crypto package transactions", () => {
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.loadCryptoPackage("@arkecosystem/core-magistrate-crypto");
        // @ts-ignore
        expect(workerScriptHandler.transactionTypes.length).not.toEqual(0);
        const config = Generators.generateCryptoConfigRaw();
        workerScriptHandler.setConfig(config);

        const check = () => {
            // @ts-ignore
            workerScriptHandler.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
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
        // @ts-ignore
        expect(workerScriptHandler.cryptoManager.NetworkConfigManager.get("genesisBlock.payloadHash")).toBe(
            config.genesisBlock.payloadHash,
        );
    });
});

describe("WorkerScriptHandler.setHeight", () => {
    it("should set height", () => {
        const config = Generators.generateCryptoConfigRaw();
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.setConfig(config);
        workerScriptHandler.setHeight(100);
        // @ts-ignore
        expect(workerScriptHandler.cryptoManager.HeightTracker.getHeight()).toBe(100);
    });
});

describe("WorkerScriptHandler.getTransactionFromData", () => {
    it("should return serialized transaction and its id", async () => {
        const config = Generators.generateCryptoConfigRaw();
        const workerScriptHandler = new WorkerScriptHandler();
        workerScriptHandler.setConfig(config);
        workerScriptHandler.setHeight(2);

        const transaction = crypto.TransactionManager.BuilderFactory.transfer()
            .version(2)
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("1")
            .sign("sender's secret")
            .build();
        const result = await workerScriptHandler.getTransactionFromData(transaction.data);

        expect(result).toEqual({ id: transaction.id, serialized: transaction.serialized.toString("hex") });
    });
});
