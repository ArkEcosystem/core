import "jest-extended";

import {
    Builders as MagistrateBuilders,
    Enums,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

let builder: MagistrateBuilders.BusinessRegistrationBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Business registration builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessRegistrationTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BusinessRegistrationBuilder();
    });

    describe("should test verification ", () => {
        it("should verify correctly with single passphrase", () => {
            const actual = builder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "http://www.website.com",
                })
                .sign("passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly with double passphrase", () => {
            const actual = builder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "http://www.website.com",
                })
                .sign("passphrase")
                .secondSign("second passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly with all fields", () => {
            const actual = builder
                .nonce("3")
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "http://www.website.com",
                    vat: "1234567890",
                    repository: "http://www.repository.com/myorg/myrepo",
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", Enums.MagistrateTransactionType.BusinessRegistration);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                MagistrateTransactions.BusinessRegistrationTransaction.staticFee(),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", { businessRegistration: {} });
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.nonce");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.name");
            expect(builder).not.toHaveProperty("data.website");
            expect(builder).not.toHaveProperty("data.vat");
            expect(builder).not.toHaveProperty("data.repository");
        });
    });

    describe("should test businessRegistration asset", () => {
        it("should test name and website", () => {
            builder.businessRegistrationAsset({ name: "google", website: "www.google.com" });
            expect(builder.data.asset.businessRegistration.name).toBe("google");
            expect(builder.data.asset.businessRegistration.website).toBe("www.google.com");
            expect(builder.data.asset.businessRegistration.vat).toBeUndefined();
            expect(builder.data.asset.businessRegistration.github).toBeUndefined();
        });
    });
});
