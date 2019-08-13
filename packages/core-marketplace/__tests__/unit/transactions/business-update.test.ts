import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessUpdateBuilder } from "../../../src/builders";
import { BusinessUpdateTransaction } from "../../../src/transactions";
import { checkCommonFields } from "../helper";

let builder: BusinessUpdateBuilder;

describe("Business update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BusinessUpdateTransaction);

    beforeEach(() => {
        builder = new BusinessUpdateBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .businessUpdateAsset({
                name: "ark",
            })
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
