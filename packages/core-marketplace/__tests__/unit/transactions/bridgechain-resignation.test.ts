import "jest-extended";

import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainResignationBuilder } from "../../../src/builders";
import { BridgechainResignationTransaction } from "../../../src/transactions";

const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

let builder: BridgechainResignationBuilder;

describe("Business registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const bridgechainResignation = builder
            .businessResignationAsset("127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935")
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(bridgechainResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, bridgechainResignation);
    });
});
