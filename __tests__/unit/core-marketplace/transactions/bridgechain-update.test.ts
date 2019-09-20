import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BridgechainUpdateBuilder } from "../../../../packages/core-marketplace/src/builders";
import { BridgechainUpdateTransaction } from "../../../../packages/core-marketplace/src/transactions";
import { checkCommonFields } from "../helper";

let builder: BridgechainUpdateBuilder;

describe("Bridgechain update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new BridgechainUpdateBuilder();
    });

    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder
            .network(23)
            .bridgechainUpdateAsset({
                bridgechainId: Utils.BigNumber.ONE,
                seedNodes: ["74.125.224.72"],
            })
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
