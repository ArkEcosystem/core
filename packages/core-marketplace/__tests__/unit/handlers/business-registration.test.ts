import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Utils } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder, BusinessResignationBuilder } from "../../../src/builders";
import { BusinessAlreadyRegisteredError, BusinessIsNotRegisteredError } from "../../../src/errors";
import { BusinessRegistrationTransactionHandler, BusinessResignationTransactionHandler } from "../../../src/handlers";
import { IBusinessWalletProperty } from "../../../src/interfaces";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";

let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: BusinessRegistrationBuilder;
let businessResignationBuilder: BusinessResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("should test business handlers", () => {
    Handlers.Registry.registerCustomTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(BusinessResignationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = Handlers.Registry.get(MarketplaceTransactionTypes.BusinessRegistration);
        businessResignationHandler = Handlers.Registry.get(MarketplaceTransactionTypes.BusinessResignation);

        businessRegistrationBuilder = new BusinessRegistrationBuilder();
        businessResignationBuilder = new BusinessResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex("byBusiness", (index: State.IWalletIndex, wallet: State.IWallet): void => {
            if (wallet.hasAttribute("business") && wallet.publicKey) {
                index.set(wallet.publicKey, wallet);
            }
        });
        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654310);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        walletManager.reindex(senderWallet);
    });

    describe("should test business registration handler", () => {
        it("should pass all handler methods", () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() =>
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).not.toThrow();

            businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletProperty>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual({
                name: "businessName",
                website: "www.website.com",
                vat: undefined,
                github: undefined,
            });

            businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should pass all handler methods, with name, website, vat and github", () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                    vat: "1234567890",
                    github: "www.github.com/myBusiness",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() =>
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).not.toThrow();

            businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletProperty>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual({
                name: "businessName",
                website: "www.website.com",
                vat: "1234567890",
                github: "www.github.com/myBusiness",
            });

            businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should fail duo to wallet already a business error", () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                    vat: "1234567890",
                    github: "www.github.com/myBusiness",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            businessRegistrationHandler.applyToSender(actual.build(), walletManager);

            expect(() => businessRegistrationHandler.applyToSender(actual.build(), walletManager)).toThrow(
                BusinessAlreadyRegisteredError,
            );
        });
    });

    describe("should test business resignation handler", () => {
        it("should fail, because business is not registered", () => {
            const actual = businessResignationBuilder
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() => businessResignationHandler.applyToSender(actual.build(), walletManager)).toThrow(
                BusinessIsNotRegisteredError,
            );
        });
    });
});
