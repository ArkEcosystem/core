import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainAlreadyRegisteredError,
    BridgechainIsResignedError,
    WalletIsNotBusinessError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import {
    IBridgechainWalletAttributes,
    IBusinessWalletAttributes,
} from "../../../../packages/core-magistrate-transactions/src/interfaces";
import {
    bridgechainIndexer,
    businessIndexer,
    MagistrateIndex,
} from "../../../../packages/core-magistrate-transactions/src/wallet-manager";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2, businessRegistrationAsset1 } from "../helper";

let businessRegistrationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;
let bridgechainResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let bridgechainRegistrationBuilder: MagistrateBuilders.BridgechainRegistrationBuilder;
let bridgechainResignationBuilder: MagistrateBuilders.BridgechainResignationBuilder;

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

        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        bridgechainRegistrationBuilder = new MagistrateBuilders.BridgechainRegistrationBuilder();
        bridgechainResignationBuilder = new MagistrateBuilders.BridgechainResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);
        walletManager.registerIndex(MagistrateIndex.Bridgechains, bridgechainIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654310);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("Bridgechain registration handler", () => {
        it("should fail, because business is not registered", async () => {
            const actual = bridgechainRegistrationBuilder
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
                        website: "http://www.website.com",
                    })
                    .fee("50000000")
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);
            });

            it("should pass because business is registered", async () => {
                const actual = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it("should throw because bridgechain is already registered", async () => {
                const actual = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await bridgechainRegistrationHandler.applyToSender(actual.build(), walletManager);

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).rejects.toThrowError(BridgechainAlreadyRegisteredError);
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
                const bridgechainRegistration = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .fee("50000000")
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                const bridgechainRegistrationBuild = bridgechainRegistration.build();

                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuild, walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains["1"].bridgechainId,
                ).toBe(1);

                bridgechainRegistration.bridgechainRegistrationAsset(bridgechainRegistrationAsset2).nonce("3");
                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains["2"].bridgechainId,
                ).toBe(2);

                const bridgechainResignation = bridgechainResignationBuilder
                    .businessResignationAsset(2)
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
                    const bridgechainRegistration = bridgechainRegistrationBuilder
                        .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                        .fee("50000000")
                        .nonce("2")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);

                    const bridgechainRegistration2 = bridgechainRegistrationBuilder
                        .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
                        .fee("50000000")
                        .nonce("3")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration2.build(), walletManager);
                    await bridgechainRegistrationHandler.revertForSender(
                        bridgechainRegistration2.build(),
                        walletManager,
                    );

                    const bridgechains: Record<string, IBridgechainWalletAttributes> = senderWallet.getAttribute(
                        "business.bridgechains",
                    );

                    expect(Object.keys(bridgechains).length).toEqual(1);
                    expect(bridgechains["1"].bridgechainId).toEqual(1);
                });
            });
        });
    });
});
