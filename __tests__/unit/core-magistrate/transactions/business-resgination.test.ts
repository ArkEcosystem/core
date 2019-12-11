import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { checkCommonFields } from "../helper";

let builder: MagistrateBuilders.BusinessResignationBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Business resignation ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessResignationTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BusinessResignationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
