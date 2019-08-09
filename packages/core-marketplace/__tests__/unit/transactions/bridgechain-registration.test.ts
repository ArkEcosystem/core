import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainRegistrationBuilder } from "../../../src/builders";
import { BridgechainRegistrationTransaction } from "../../../src/transactions";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2, checkCommonFields } from "../helper";

let builder: BridgechainRegistrationBuilder;

describe("Bridgechain registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainRegistrationTransaction);

    beforeEach(() => {
        builder = new BridgechainRegistrationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const bridgechainRegistration = builder
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
            .network(23)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(bridgechainRegistration).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, bridgechainRegistration);

        expect(deserialized.data.asset.bridgechainRegistration.name).toBe(
            bridgechainRegistration.asset.bridgechainRegistration.name,
        );
    });

    it("should ser/deserialize giving back original fieldss", () => {
        const bridgechainRegistration = builder
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
            .fee("50000000")
            .network(23)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(bridgechainRegistration).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, bridgechainRegistration);

        expect(deserialized.data.asset.bridgechainRegistration.name).toBe(
            bridgechainRegistration.asset.bridgechainRegistration.name,
        );
    });
});
