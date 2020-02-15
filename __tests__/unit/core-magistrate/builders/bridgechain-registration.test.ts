import "jest-extended";

import {
    Builders as MagistrateBuilders,
    Enums,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Errors, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    bridgechainRegistrationAsset1,
    bridgechainRegistrationAsset2,
    bridgechainRegistrationAssetBad,
} from "../helper";

let builder: MagistrateBuilders.BridgechainRegistrationBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Bridgechain registration builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainRegistrationTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainRegistrationBuilder();
    });

    describe("should test verification", () => {
        it("should verify correctly with single passphrase", () => {
            let actual = builder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquirev");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();

            actual = builder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquirev");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", Enums.MagistrateTransactionType.BridgechainRegistration);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                MagistrateTransactions.BridgechainRegistrationTransaction.staticFee(),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", { bridgechainRegistration: {} });
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.nonce");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.name");
            expect(builder).not.toHaveProperty("data.seedNodes");
            expect(builder).not.toHaveProperty("data.genesisHash");
            expect(builder).not.toHaveProperty("data.bridgechainRepository");
        });
    });

    describe("should test asset", () => {
        it("should reject bad seednodes", () => {
            expect(() =>
                builder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAssetBad)
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquirev")
                    .build(),
            ).toThrowError(Errors.TransactionSchemaError);
        });
    });
});
