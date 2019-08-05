import "jest-extended";

import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessResignationBuilder } from "../../../src/builders";
import { BusinessResignationTransaction } from "../../../src/transactions";

const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

let builder: BusinessResignationBuilder;

describe("Business resignation ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BusinessResignationTransaction);

    beforeEach(() => {
        builder = new BusinessResignationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
