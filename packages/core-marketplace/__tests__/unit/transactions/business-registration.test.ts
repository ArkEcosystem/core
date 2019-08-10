import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../src/builders";
import { BusinessRegistrationTransaction } from "../../../src/transactions";
import { businessRegistrationAsset1, checkCommonFields } from "../helper";

let builder: BusinessRegistrationBuilder;

describe("Business registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");

    Transactions.TransactionRegistry.registerTransactionType(BusinessRegistrationTransaction);

    beforeEach(() => {
        builder = new BusinessRegistrationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessRegistration = builder
            .businessRegistrationAsset(businessRegistrationAsset1)
            .network(23)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessRegistration);

        expect(deserialized.data.asset.businessRegistration).toStrictEqual(businessRegistrationAsset1);
    });
});
