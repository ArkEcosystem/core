import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../src/builders";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";
import { BusinessRegistrationTransaction } from "../../../src/transactions";

let builder: BusinessRegistrationBuilder;

describe("Business registration builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BusinessRegistrationTransaction);

    beforeEach(() => {
        builder = new BusinessRegistrationBuilder();
    });

    describe("should test verification ", () => {
        it("should verify correctly with single passphrase", () => {
            const actual = builder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .sign("passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly with double passphrase", () => {
            const actual = builder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
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
                    website: "www.website.com",
                    vat: "1234567890",
                    github: "www.github.com/google",
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", MarketplaceTransactionTypes.BusinessRegistration);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", BusinessRegistrationTransaction.staticFee());
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
            expect(builder).not.toHaveProperty("data.github");
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
