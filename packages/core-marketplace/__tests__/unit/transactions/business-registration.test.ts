import "jest-extended";

import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../src/builders";
import { BusinessRegistrationTransaction } from "../../../src/transactions";

const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

let builder: BusinessRegistrationBuilder;

describe("Business registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BusinessRegistrationTransaction);

    beforeEach(() => {
        builder = new BusinessRegistrationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessRegistration = builder
            .businessRegistrationAsset({
                name: "businessName",
                website: "www.website.com",
            })
            .fee("50000000")
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessRegistration);

        expect(deserialized.data.asset.businessRegistration.name).toBe(
            businessRegistration.asset.businessRegistration.name,
        );
        expect(deserialized.data.asset.businessRegistration.website).toBe(
            businessRegistration.asset.businessRegistration.website,
        );
        expect(deserialized.data.asset.businessRegistration.vat).toBe(
            businessRegistration.asset.businessRegistration.vat,
        );
        expect(deserialized.data.asset.businessRegistration.github).toBe(
            businessRegistration.asset.businessRegistration.github,
        );
    });
});
