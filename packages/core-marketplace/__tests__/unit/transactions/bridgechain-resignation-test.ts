import { Managers, Transactions } from "@arkecosystem/crypto";
import "jest-extended";
import { BridgechainResignationBuilder } from "../../../src/builders";
import { BridgechainResignationTransaction } from "../../../src/transactions";
import { checkCommonFields } from "../helper";

let builder: BridgechainResignationBuilder;

describe("Business registration ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });
    it("should ser/deserialize giving back original fields", () => {
        const bridgechainResignation = builder
            .fee("50000000")
            .network(23)
            .version(2)
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(bridgechainResignation).serialized.toString("hex");
        const deserialized = Transactions.deserializer.deserialize(serialized);

        checkCommonFields(deserialized, bridgechainResignation);
    });
});
