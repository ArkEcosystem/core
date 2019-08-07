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
                vat: undefined,
                github: undefined,
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

            await expect(
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuilded, walletManager),
            ).toResolve();

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
            await expect(
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
            ).toResolve();

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
