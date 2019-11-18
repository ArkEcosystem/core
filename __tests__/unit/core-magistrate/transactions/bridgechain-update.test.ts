import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { checkCommonFields } from "../helper";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: MagistrateBuilders.BridgechainUpdateBuilder;

describe("Bridgechain update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");

    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainUpdateBuilder();
    });

    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .bridgechainUpdateAsset({
                bridgechainId: genesisHash,
                seedNodes: ["74.125.224.72"],
            })
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
