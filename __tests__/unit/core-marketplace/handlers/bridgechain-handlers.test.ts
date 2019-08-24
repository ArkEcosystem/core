import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainRegistrationBuilder,
    BridgechainResignationBuilder,
    BusinessRegistrationBuilder,
} from "../../../../packages/core-marketplace/src/builders";

import { BridgechainIsResignedError, WalletIsNotBusinessError } from "../../../../packages/core-marketplace/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-marketplace/src/handlers";
import { IBusinessWalletAttributes } from "../../../../packages/core-marketplace/src/interfaces";
import {
    bridgechainIndexer,
    businessIndexer,
    MarketplaceIndex,
} from "../../../../packages/core-marketplace/src/wallet-manager";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2, businessRegistrationAsset1 } from "../helper";

let businessRegistrationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;
let bridgechainResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: BusinessRegistrationBuilder;
let bridgechianRegistrationBuilder: BridgechainRegistrationBuilder;
let bridgechainResignationBuilder: BridgechainResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("should test marketplace transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainResignationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        bridgechainRegistrationHandler = new BridgechainRegistrationTransactionHandler();
        bridgechainResignationHandler = new BridgechainResignationTransactionHandler();

        businessRegistrationBuilder = new BusinessRegistrationBuilder();
        bridgechianRegistrationBuilder = new BridgechainRegistrationBuilder();
        bridgechainResignationBuilder = new BridgechainResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MarketplaceIndex.Businesses, businessIndexer);
        walletManager.registerIndex(MarketplaceIndex.Bridgechains, bridgechainIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654310);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("Bridgechain registration handler", () => {
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

        describe("Business registered", () => {
            beforeEach(async () => {
                const businessRegistration = businessRegistrationBuilder
                    .businessRegistrationAsset({
                        name: "businessName",
                        website: "www.website.com",
                    })
                    .fee("50000000")
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);
            });

            it("should pass because business is registered", async () => {
                const actual = bridgechianRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it("should not throw after multiple bridgechain registrations", async () => {
                const actual = bridgechianRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await bridgechainRegistrationHandler.applyToSender(actual.build(), walletManager);

                actual.nonce("3");
                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });
        });

        describe("applyToSender tests", () => {
            beforeEach(async () => {
                const businessRegistration = businessRegistrationBuilder
                    .businessRegistrationAsset(businessRegistrationAsset1)
                    .fee("50000000")
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);
            });

            it("should pass, because business is registered", async () => {
                const bridgechainRegistration = bridgechianRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                const bridgechainRegistrationBuild = bridgechainRegistration.build();

                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuild, walletManager),
                ).toResolve();

                expect(
                    senderWallet
                        .getAttribute<IBusinessWalletAttributes>("business")
                        .bridgechains["1"].bridgechainId.toFixed(),
                ).toBe("1");

                bridgechainRegistration.bridgechainRegistrationAsset(bridgechainRegistrationAsset2).nonce("3");
                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
                ).toResolve();

                expect(
                    senderWallet
                        .getAttribute<IBusinessWalletAttributes>("business")
                        .bridgechains["2"].bridgechainId.toFixed(),
                ).toBe("2");

                const bridgechainResignation = bridgechainResignationBuilder
                    .businessResignationAsset("2")
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

            describe("revert for sender", () => {
                it("should be correct", async () => {
                    const bridgechainRegistration = bridgechianRegistrationBuilder
                        .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
                        .fee("50000000")
                        .nonce("2")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);
                    bridgechainRegistration.nonce("3");
                    const bridgechainRegistrationBuild = bridgechainRegistration.build();
                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuild, walletManager);
                    await bridgechainRegistrationHandler.revertForSender(bridgechainRegistrationBuild, walletManager);
                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);

                    expect(
                        senderWallet
                            .getAttribute<IBusinessWalletAttributes>("business")
                            .bridgechains[1].bridgechainId.toFixed(),
                    ).toEqual("1");
                });
            });
        });
    });
});
