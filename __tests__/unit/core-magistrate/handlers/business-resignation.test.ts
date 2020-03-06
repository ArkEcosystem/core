import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import {
    BridgechainsAreNotResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { bridgechainRegistrationAsset1, businessRegistrationAsset1 } from "../helper";

// Mock database with walletManager
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

// Handler declarations
let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;
let bridgechainRegistrationHandler: Handlers.TransactionHandler;

// Builder declarations
let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let businessResignationBuilder: MagistrateBuilders.BusinessResignationBuilder;
let bridgechainRegistrationBuilder: MagistrateBuilders.BridgechainRegistrationBuilder;

// Sender Wallet declaration
let senderWallet: Wallets.Wallet;

// Wallet Manager declaration
let walletManager: State.IWalletManager;

const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Business resignation handler", () => {
    // Manager configurations
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

    // Handlers registries
    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);

    beforeEach(() => {
        // Handler initializations
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();
        bridgechainRegistrationHandler = new BridgechainRegistrationTransactionHandler();

        // Builder initializations
        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        businessResignationBuilder = new MagistrateBuilders.BusinessResignationBuilder();
        bridgechainRegistrationBuilder = new MagistrateBuilders.BridgechainRegistrationBuilder();

        // Wallet Manager initialization
        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        // Sender Wallet initialization
        senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(passphrase));
        senderWallet.balance = Utils.BigNumber.make(45276543120);
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);

        walletManager.reindex(senderWallet);
    });

    it("should throw BusinessIsNotRegisteredError, because business is not registered", async () => {
        const actual = businessResignationBuilder
            .fee("100")
            .nonce("1")
            .sign(passphrase);

        await expect(
            businessResignationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
        ).rejects.toThrowError(BusinessIsNotRegisteredError);
    });

    describe("Business registered tests", () => {
        let registeredTransaction;

        beforeEach(async () => {
            registeredTransaction = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign(passphrase);

            await businessRegistrationHandler.applyToSender(registeredTransaction.build(), walletManager);
        });

        it("should pass throwIfCannotBeApplied, because business is registered", async () => {
            const actual = businessResignationBuilder.nonce("2").sign(passphrase);

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();
        });

        it("should throw BusinessIsResignedError, because wallet already resigned once", async () => {
            const resignationPass = businessResignationBuilder.nonce("2").sign(passphrase);

            await expect(businessResignationHandler.applyToSender(resignationPass.build(), walletManager)).toResolve();

            const resignationThrow = businessResignationBuilder.nonce("3").sign(passphrase);

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(
                    resignationThrow.build(),
                    senderWallet,
                    walletManager,
                ),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw BridgechainsAreNotResignedError when business has not resigned bridgechains", async () => {
            const bridgechainRegistration = bridgechainRegistrationBuilder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                .nonce("2")
                .sign(passphrase);
            await expect(
                bridgechainRegistrationHandler.applyToSender(bridgechainRegistration.build(), walletManager),
            ).toResolve();

            const resignationThrow = businessResignationBuilder.nonce("3").sign(passphrase);

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(
                    resignationThrow.build(),
                    senderWallet,
                    walletManager,
                ),
            ).rejects.toThrowError(BridgechainsAreNotResignedError);
        });

        it("should have property business.resigned equal to true", async () => {
            const actual = businessResignationBuilder.nonce("2").sign(passphrase);

            await businessResignationHandler.applyToSender(actual.build(), walletManager);

            expect(senderWallet.getAttribute("business.resigned")).toBeTrue();
        });
    });
});
