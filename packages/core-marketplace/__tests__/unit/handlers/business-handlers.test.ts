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
    WalletIsNotBusinessError,
} from "../../../src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "../../../src/handlers";
import { IBusinessWalletProperty } from "../../../src/interfaces";

let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;
// @ts-ignore
let bridgechainResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: BusinessRegistrationBuilder;
let businessResignationBuilder: BusinessResignationBuilder;
let bridgechianRegistrationBuilder: BridgechainRegistrationBuilder;
// @ts-ignore
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

        it("should pass, because business is registered", () => {
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

            expect(() =>
                businessRegistrationHandler.applyToSender(businessRegister.build(), walletManager),
            ).not.toThrow();
            expect(() =>
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).not.toThrow();

            businessResignation.nonce("3");
            expect(() =>
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).toThrow();
        });
    });

    describe("should test bridgechain registration handler", () => {
        it("should fail, because business is not registered", () => {
            const actual = bridgechianRegistrationBuilder
                .bridgechainRegistrationAsset({
                    name: "crypti",
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    githubRepository: "www.github.com/ArkEcosystem/core",
                    seedNodes: [
                        {
                            ipv4: "1.2.3.4",
                            ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                        },
                    ],
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() =>
                bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toThrow(new WalletIsNotBusinessError());
        });

        it("should pass, because business is registered", () => {
            const businessRegistration = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "www.website.com",
                })
                .fee("50000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);

            const bridgechainRegistration = bridgechianRegistrationBuilder
                .bridgechainRegistrationAsset({
                    name: "firstCrypto",
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    githubRepository: "www.github.com/ArkEcosystem/core",
                    seedNodes: [
                        {
                            ipv4: "1.2.3.4",
                            ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                        },
                    ],
                })
                .fee("50000000")
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            const bridgechainRegistrationBuilded = bridgechainRegistration.build();

            expect(() =>
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuilded, walletManager),
            ).not.toThrow();

            bridgechainRegistration
                .bridgechainRegistrationAsset({
                    name: "secondCrypto",
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    githubRepository: "www.github.com/ArkEcosystem/core",
                    seedNodes: [
                        {
                            ipv4: "1.2.3.4",
                            ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                        },
                    ],
                })
                .nonce("3");
            expect(() =>
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
            ).not.toThrow();

            const bridgechainResignation = bridgechainResignationBuilder
                .businessResignationAsset(bridgechainRegistrationBuilded.id)
                .fee("50000000")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() =>
                bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
            ).not.toThrow();

            bridgechainResignation.nonce("5");
            expect(() =>
                bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
            ).toThrow(new BridgechainIsResignedError());
        });
    });
});
