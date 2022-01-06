import "jest-extended";

import { BusinessResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

import { checkCommonFields } from "../helper";

let builder: BusinessResignationBuilder;

describe("Business resignation ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(BusinessResignationTransaction);

    beforeEach(() => {
        builder = new BusinessResignationBuilder();
    });

    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder.network(23).version(2).sign("passphrase").getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
