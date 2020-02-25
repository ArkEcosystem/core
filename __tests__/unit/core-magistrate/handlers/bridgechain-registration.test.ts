import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import {
    BridgechainAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import {
    IBridgechainWalletAttributes,
    IBusinessWalletAttributes,
} from "../../../../packages/core-magistrate-transactions/src/interfaces";
import { businessIndexer, MagistrateIndex } from "../../../../packages/core-magistrate-transactions/src/wallet-manager";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2, businessRegistrationAsset1 } from "../helper";

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

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let bridgechainRegistrationBuilder: MagistrateBuilders.BridgechainRegistrationBuilder;

let senderWallet: Wallets.Wallet;
const otherPassphrase = "other wallet passphrase";
let otherWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("should test marketplace transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        bridgechainRegistrationHandler = new BridgechainRegistrationTransactionHandler();

        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        bridgechainRegistrationBuilder = new MagistrateBuilders.BridgechainRegistrationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("500000000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);

        otherWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(otherPassphrase));
        otherWallet.balance = Utils.BigNumber.make("500000000000000");
        otherWallet.publicKey = Identities.PublicKey.fromPassphrase(otherPassphrase);
        walletManager.reindex(otherWallet);
    });

    describe("Bridgechain registration handler", () => {
        it("should fail, because business is not registered", async () => {
            const actual = bridgechainRegistrationBuilder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
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
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);

                const businessRegistration2 = businessRegistrationBuilder
                    .businessRegistrationAsset({
                        name: "business2",
                        website: "http://www.website2.com",
                    })
                    .nonce("1")
                    .sign(otherPassphrase);

                await businessRegistrationHandler.applyToSender(businessRegistration2.build(), walletManager);
            });

            it("should pass because business is registered", async () => {
                const actual = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it("should throw because bridgechain is already registered by same wallet", async () => {
                const actual = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await bridgechainRegistrationHandler.applyToSender(actual.build(), walletManager);

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).rejects.toThrowError(BridgechainAlreadyRegisteredError);
            });

            it("should not throw when bridgechain is registered by another wallet", async () => {
                const otherBridgechainRegistration = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign(otherPassphrase);
                await bridgechainRegistrationHandler.applyToSender(otherBridgechainRegistration.build(), walletManager);

                const actual = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    bridgechainRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it.each([["@invalid/UPPERCASE"], ["@invalid/char)"]])(
                "should throw because ports contains invalid package name",
                async invalidName => {
                    const actual = bridgechainRegistrationBuilder
                        .bridgechainRegistrationAsset({
                            ...bridgechainRegistrationAsset1,
                            ports: {
                                ...bridgechainRegistrationAsset1.ports,
                                [invalidName]: 4444,
                            },
                        })
                        .nonce("2")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await expect(
                        bridgechainRegistrationHandler.throwIfCannotBeApplied(
                            actual.build(),
                            senderWallet,
                            walletManager,
                        ),
                    ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
                },
            );
        });

        describe("applyToSender tests", () => {
            beforeEach(async () => {
                const businessRegistration = businessRegistrationBuilder
                    .businessRegistrationAsset(businessRegistrationAsset1)
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
                await businessRegistrationHandler.applyToSender(businessRegistration.build(), walletManager);
            });

            it("should pass, because business is registered", async () => {
                const bridgechainRegistration = bridgechainRegistrationBuilder
                    .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                const bridgechainRegistrationBuild = bridgechainRegistration.build();

                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistrationBuild, walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainRegistrationAsset1.genesisHash
                    ].bridgechainAsset,
                ).toEqual(bridgechainRegistrationAsset1);

                bridgechainRegistration.bridgechainRegistrationAsset(bridgechainRegistrationAsset2).nonce("3");
                await expect(
                    bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
                ).toResolve();

                expect(
                    senderWallet.getAttribute<IBusinessWalletAttributes>("business").bridgechains[
                        bridgechainRegistrationAsset2.genesisHash
                    ].bridgechainAsset,
                ).toEqual(bridgechainRegistrationAsset2);
            });

            describe("revert for sender", () => {
                it("should be correct", async () => {
                    const bridgechainRegistration = bridgechainRegistrationBuilder
                        .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                        .nonce("2")
                        .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                    await bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager);

                    const bridgechainRegistration2 = bridgechainRegistrationBuilder
                        .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
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
                    expect(
                        bridgechains[bridgechainRegistrationAsset1.genesisHash].bridgechainAsset.genesisHash,
                    ).toEqual(bridgechainRegistrationAsset1.genesisHash);
                });
            });
        });
    });
});
