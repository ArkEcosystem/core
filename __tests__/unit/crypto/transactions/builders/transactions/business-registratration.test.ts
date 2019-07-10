import { feeManager } from "@arkecosystem/crypto/src/managers";
import { BigNumber } from "@arkecosystem/crypto/src/utils";
import "jest-extended";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions/builders";
import { BusinessRegistrationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/business-registration";

let builder: BusinessRegistrationBuilder;

describe("Business Registration Transaction", () => {
    describe("verify", () => {
        beforeEach(() => {
            builder = BuilderFactory.businessRegistration();
        });

        it("should be valid with a signature", () => {
            const actual = builder.businessRegistrationAsset("name", "www.website.com").sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        beforeEach(() => {
            builder = BuilderFactory.businessRegistration();
        });

        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionTypes.BusinessRegistration);
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.BusinessRegistration));
            expect(builder).toHaveProperty("data.asset", { businessRegistration: {} });
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.businessRegistration");
        });
    });

    describe("Business registration asset", () => {
        beforeEach(() => {
            builder = BuilderFactory.businessRegistration();
        });

        it("establishes name and websiteAddress of the asset", () => {
            builder.businessRegistrationAsset("name", "www.website.com");
            expect(builder.data.asset.businessRegistration.name).toBe("name");
            expect(builder.data.asset.businessRegistration.websiteAddress).toBe("www.website.com");
            expect(builder.data.asset.businessRegistration.vat).toBe(undefined);
            expect(builder.data.asset.businessRegistration.githubRepository).toBe(undefined);
        });

        it("establishes name, websiteAddress and VAT of the asset", () => {
            builder.businessRegistrationAsset("name", "www.website.com", "1234567890");
            expect(builder.data.asset.businessRegistration.name).toBe("name");
            expect(builder.data.asset.businessRegistration.websiteAddress).toBe("www.website.com");
            expect(builder.data.asset.businessRegistration.vat).toBe("1234567890");
            expect(builder.data.asset.businessRegistration.githubRepository).toBe(undefined);
        });

        it("establishes name, websiteAddress, VAT and github of the asset", () => {
            builder.businessRegistrationAsset("name", "www.website.com", "1234567890", "www.github.com");
            expect(builder.data.asset.businessRegistration.name).toBe("name");
            expect(builder.data.asset.businessRegistration.websiteAddress).toBe("www.website.com");
            expect(builder.data.asset.businessRegistration.vat).toBe("1234567890");
            expect(builder.data.asset.businessRegistration.githubRepository).toBe("www.github.com");
        });
    });
});
