import { Managers, Transactions } from "@arkecosystem/crypto";
import "jest-extended";
import { BusinessResignationBuilder } from "../../../src/builders";
import { BusinessResignationTransaction } from "../../../src/transactions";
import { checkCommonFields } from "../helper";

let builder: BusinessResignationBuilder;

describe("Business resignation ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BusinessResignationTransaction);

    beforeEach(() => {
        builder = new BusinessResignationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .fee("50000000")
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
