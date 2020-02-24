import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    WalletIsNotBusinessError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { IBusinessWalletAttributes } from "../../../../packages/core-magistrate-transactions/src/interfaces";
import { businessIndexer, MagistrateIndex } from "../../../../packages/core-magistrate-transactions/src/wallet-manager";
import { bridgechainRegistrationAsset1 } from "../helper";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                switch (name) {
                    case "database":
                        return {
                            walletManager,
                        };
                    default:
                        return {};
                }
            },
        },
    };
});

let businessRegistrationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;
let bridgechainResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let bridgechainRegistrationBuilder: MagistrateBuilders.BridgechainRegistrationBuilder;
let bridgechainResignationBuilder: MagistrateBuilders.BridgechainResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Bridgechain resignation handler", () => {
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

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("500000000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("When business is not registered", () => {
        it("should throw because business is not registered", async () => {
            const bridgechainResignation = bridgechainResignationBuilder
                .bridgechainResignationAsset(bridgechainRegistrationAsset1.genesisHash)
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainResignationHandler.throwIfCannotBeApplied(
                    bridgechainResignation.build(),
                    senderWallet,
                    walletManager,
                ),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });
    });

    describe("When business is registered", () => {
        beforeEach(async () => {
            const businessRegistration = businessRegistrationBuilder
                .businessRegistrationAsset({
                    name: "businessName",
                    website: "http://www.website.com",
                })
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);
        });

        it("should throw because bridgechain is not registered", async () => {
            const bridgechainResignation = bridgechainResignationBuilder
                .bridgechainResignationAsset(bridgechainRegistrationAsset1.genesisHash)
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainResignationHandler.throwIfCannotBeApplied(
                    bridgechainResignation.build(),
                    senderWallet,
                    walletManager,
                ),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        describe("When bridgechain is registered", () => {
            beforeEach(async () => {
                const bridgechainRegistration = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);
            });

            it("should throw when bridgechain is already resigned", async () => {
                const bridgechainResignation = bridgechainResignationBuilder
                    .bridgechainResignationAsset(bridgechainRegistrationAsset1.genesisHash)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
                ).toResolve();

                bridgechainResignation.nonce("4");
                await expect(
                    bridgechainResignationHandler.throwIfCannotBeApplied(
                        bridgechainResignation.build(),
                        senderWallet,
                        walletManager,
                    ),
                ).rejects.toThrowError(BridgechainIsResignedError);
                await expect(
                    bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
                ).rejects.toThrowError(BridgechainIsResignedError);
            });

            it("should apply and revert bridgechain resignation", async () => {
                const bridgechainResignation = bridgechainResignationBuilder
                    .bridgechainResignationAsset(bridgechainRegistrationAsset1.genesisHash)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainResignationHandler.applyToSender(bridgechainResignation.build(), walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainRegistrationAsset1.genesisHash
                    ],
                ).toHaveProperty("resigned", true);

                await expect(
                    bridgechainResignationHandler.revertForSender(bridgechainResignation.build(), walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainRegistrationAsset1.genesisHash
                    ],
                ).toHaveProperty("resigned", false);
            });
        });
    });
});
