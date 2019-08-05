import "jest-extended";

import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainRegistrationBuilder } from "../../../src/builders";
import { BridgechainRegistrationTransaction } from "../../../src/transactions";

const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

let builder: BridgechainRegistrationBuilder;

describe("Bridgechain registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainRegistrationTransaction);

    beforeEach(() => {
        builder = new BridgechainRegistrationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const bridgechainRegistration = builder
            .bridgechainRegistrationAsset({
                name: "name",
                seedNodes: [
                    {
                        ipv4: "1.2.3.4",
                        ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                    },
                    {
                        ipv4: "1.2.3.5",
                        ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7332",
                    },
                ],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                githubRepository: "github",
            })
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
            .bridgechainRegistrationAsset({
                name: "name",
                seedNodes: [
                    {
                        ipv4: "1.2.3.4",
                    },
                    {
                        ipv4: "1.2.3.3",
                        ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                    },
                ],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                githubRepository: "github",
            })
            .fee("50000000")
            .network(23)
            .version(2)
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
