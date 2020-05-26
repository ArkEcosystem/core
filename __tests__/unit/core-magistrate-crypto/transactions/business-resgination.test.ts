import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { BusinessResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";

import { checkCommonFields } from "../helper";

let crypto: CryptoSuite.CryptoSuite;
let builder: BusinessResignationBuilder<any, any, any>;

describe("Business resignation ser/deser", () => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
    crypto.CryptoManager.HeightTracker.setHeight(2);
    crypto.TransactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        BusinessResignationTransaction,
    );

    beforeEach(() => {
        builder = new BusinessResignationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
    });
    it("should ser/deserialize giving back original fields", () => {
        const businessResignation = builder.version(2).sign("passphrase").getStruct();

        const serialized = crypto.TransactionManager.TransactionFactory.fromData(
            businessResignation,
        ).serialized.toString("hex");
        const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, businessResignation);
    });
});
