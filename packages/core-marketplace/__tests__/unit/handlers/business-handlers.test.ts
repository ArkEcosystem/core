import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainRegistrationBuilder,
    BridgechainResignationBuilder,
    BusinessRegistrationBuilder,
    BusinessResignationBuilder,
} from "../../../src/builders";
import {
    BridgechainIsResignedError,
    BusinessAlreadyRegisteredError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "../../../src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "../../../src/handlers";
import { IBusinessWalletProperty } from "../../../src/interfaces";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2 } from "../helper";

let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;
let bridgechainResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: BusinessRegistrationBuilder;
let businessResignationBuilder: BusinessResignationBuilder;
let bridgechianRegistrationBuilder: BridgechainRegistrationBuilder;
let bridgechainResignationBuilder: BridgechainResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("should test marketplace transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainResignationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();
        bridgechainRegistrationHandler = new BridgechainRegistrationTransactionHandler();
        bridgechainResignationHandler = new BridgechainResignationTransactionHandler();

        businessRegistrationBuilder = new BusinessRegistrationBuilder();
        businessResignationBuilder = new BusinessResignationBuilder();
        bridgechianRegistrationBuilder = new BridgechainRegistrationBuilder();
        bridgechainResignationBuilder = new BridgechainResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex("byBusiness", (index: State.IWalletIndex, wallet: Wallets.Wallet): void => {
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
        it("should pass all handler methods", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletProperty>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual({
                name: "businessName",
                website: "www.website.com",
            });

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should pass all handler methods, with name, website, vat and github", async () => {
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

            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletProperty>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual({
                name: "businessName",
                website: "www.website.com",
                vat: "1234567890",
                github: "www.github.com/myBusiness",
            });

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should fail duo to wallet already a business error", async () => {
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

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);

            actual.nonce("2");
            await expect(businessRegistrationHandler.applyToSender(actual.build(), walletManager)).rejects.toThrowError(
                BusinessAlreadyRegisteredError,
            );
        });
    });

    describe("should test business resignation handler", () => {
        it("should fail, because business is not registered", async () => {
            const actual = businessResignationBuilder
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(businessResignationHandler.applyToSender(actual.build(), walletManager)).rejects.toThrowError(
                BusinessIsNotRegisteredError,
            );
        });

        it("should pass, because business is registered", async () => {
            const businessRegister = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            const businessResignation = businessResignationBuilder
                .fee("50000000")
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessRegistrationHandler.applyToSender(businessRegister.build(), walletManager),
            ).toResolve();
            await expect(
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).toResolve();

            businessResignation.nonce("3");
            await expect(
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).rejects.toThrowError(BusinessIsResignedError);
        });
    });

    describe("should test bridgechain registration handler", () => {
        it("should fail, because business is not registered", async () => {
            const actual = bridgechianRegistrationBuilder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should pass, because business is registered", async () => {
            const businessRegistration = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);

            const bridgechainRegistration = bridgechianRegistrationBuilder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                .fee("50000000")
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            const bridgechainRegistrationBuilded = bridgechainRegistration.build();

            await expect(
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuilded, walletManager),
            ).toResolve();

            expect(
                senderWallet.getAttribute<IBusinessWalletProperty>("business").bridgechains[0].bridgechainNonce,
            ).toBe(1001);

            bridgechainRegistration.bridgechainRegistrationAsset(bridgechainRegistrationAsset2).nonce("3");
            await expect(
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
            ).toResolve();

            expect(
                senderWallet.getAttribute<IBusinessWalletProperty>("business").bridgechains[1].bridgechainNonce,
            ).toBe(1002);

            const bridgechainResignation = bridgechainResignationBuilder
                .businessResignationAsset(bridgechainRegistrationBuilded.id)
                .fee("50000000")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
            ).toResolve();

            bridgechainResignation.nonce("5");
            await expect(
                bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
            ).rejects.toThrowError(BridgechainIsResignedError);
        });
    });
});
