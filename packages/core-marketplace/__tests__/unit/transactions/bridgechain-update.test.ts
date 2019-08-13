import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainUpdateBuilder } from "../../../src/builders";
import { BridgechainUpdateTransaction } from "../../../src/transactions";
import { checkCommonFields } from "../helper";

let builder: BridgechainUpdateBuilder;

describe("Bridgechain update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new BridgechainUpdateBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .bridgechainUpdateAsset({
                registeredBridgechainId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                seedNodes: ["127.0.0.1"],
            })
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
