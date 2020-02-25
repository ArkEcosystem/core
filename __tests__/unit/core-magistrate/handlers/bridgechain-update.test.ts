import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { IBusinessWalletAttributes } from "@arkecosystem/core-magistrate-transactions/src/interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredByWalletError,
    BusinessIsNotRegisteredError,
    PortKeyMustBeValidPackageNameError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { businessIndexer, MagistrateIndex } from "../../../../packages/core-magistrate-transactions/src/wallet-manager";
import {
    bridgechainRegistrationAsset1,
    bridgechainRegistrationAsset2,
    bridgechainUpdateAsset1,
    bridgechainUpdateAsset2,
} from "../helper";

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
let bridgechainUpdateHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let bridgechainRegistrationBuilder: MagistrateBuilders.BridgechainRegistrationBuilder;
let bridgechainUpdateBuilder: MagistrateBuilders.BridgechainUpdateBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Bridgechain update handler", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainUpdateTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        bridgechainRegistrationHandler = new BridgechainRegistrationTransactionHandler();
        bridgechainUpdateHandler = new BridgechainUpdateTransactionHandler();

        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        bridgechainRegistrationBuilder = new MagistrateBuilders.BridgechainRegistrationBuilder();
        bridgechainUpdateBuilder = new MagistrateBuilders.BridgechainUpdateBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("500000000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("When business is not registered", () => {
        it("should throw because business is not registered", async () => {
            const actual = bridgechainUpdateBuilder
                .bridgechainUpdateAsset(bridgechainUpdateAsset1)
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessIsNotRegisteredError);
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
            const actual = bridgechainUpdateBuilder
                .bridgechainUpdateAsset(bridgechainUpdateAsset1)
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
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

            it.each([["@invalid/UPPERCASE"], ["@invalid/char)"]])(
                "should throw because ports contains invalid package name",
                async invalidName => {
                    const actual = bridgechainUpdateBuilder
                        .bridgechainUpdateAsset({
                            ...bridgechainUpdateAsset1,
                            ports: {
                                ...bridgechainUpdateAsset1.ports,
                                [invalidName]: 4444,
                            },
                        })
                        .nonce("3")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await expect(
                        bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                    ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
                },
            );

            it("should not throw because bridgechain is registered", async () => {
                const actual = bridgechainUpdateBuilder
                    .bridgechainUpdateAsset(bridgechainUpdateAsset1)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it("should apply the bridgechain update (existing asset repository)", async () => {
                const actual = bridgechainUpdateBuilder
                    .bridgechainUpdateAsset(bridgechainUpdateAsset1)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();

                await bridgechainUpdateHandler.applyToSender(actual.build(), walletManager);

                const expectedBridgechainAsset = { ...bridgechainRegistrationAsset1, ...bridgechainUpdateAsset1 };
                delete expectedBridgechainAsset.bridgechainId;

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainUpdateAsset1.bridgechainId
                    ].bridgechainAsset,
                ).toEqual(expectedBridgechainAsset);
            });

            it("should apply the bridgechain update (asset repository not set)", async () => {
                const bridgechainRegistration = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainRegistrationAsset2.genesisHash
                    ].bridgechainAsset,
                ).toEqual(bridgechainRegistrationAsset2);

                const actual = bridgechainUpdateBuilder
                    .bridgechainUpdateAsset(bridgechainUpdateAsset2)
                    .nonce("4")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();

                await bridgechainUpdateHandler.applyToSender(actual.build(), walletManager);

                const expectedBridgechainAsset = { ...bridgechainRegistrationAsset2, ...bridgechainUpdateAsset2 };
                delete expectedBridgechainAsset.bridgechainId;

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainUpdateAsset2.bridgechainId
                    ].bridgechainAsset,
                ).toEqual(expectedBridgechainAsset);
            });
        });
    });
});
