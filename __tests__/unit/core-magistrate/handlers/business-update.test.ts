import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import {
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import {
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { businessRegistrationAsset1, businessUpdateAsset1 } from "../helper";

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
let businessUpdateHandler: Handlers.TransactionHandler;

// Builder declarations
let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let businessResignationBuilder: MagistrateBuilders.BusinessResignationBuilder;
let businessUpdateBuilder: MagistrateBuilders.BusinessUpdateBuilder;


// Sender Wallet declaration
let senderWallet: Wallets.Wallet;

// Wallet Manager declaration
let walletManager: State.IWalletManager;


describe("Business update handler", () => {
    // Manager configurations
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

    // Handler registries
    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessUpdateTransactionHandler);

    beforeEach(() => {
        // Handler initializations
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();
        businessUpdateHandler = new BusinessUpdateTransactionHandler();

        // Builder initializations
        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        businessResignationBuilder = new MagistrateBuilders.BusinessResignationBuilder();
        businessUpdateBuilder = new MagistrateBuilders.BusinessUpdateBuilder();

        // Wallet Manager initialization
        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        // Sender Wallet initialization
        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(45276543120);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        walletManager.reindex(senderWallet);
    });

    describe("Business update handler", () => {
        it("should throw BusinessIsNotRegisteredError, because business is not registered", async () => {

            const actual = businessUpdateBuilder
                .businessUpdateAsset(businessUpdateAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessIsNotRegisteredError);
        });

        describe("Business registered tests", ()=>{
            let registeredTransaction;

            beforeEach(async () => {
                registeredTransaction = businessRegistrationBuilder
                    .businessRegistrationAsset(businessRegistrationAsset1)
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await businessRegistrationHandler.applyToSender(registeredTransaction.build(), walletManager);

            });

            it("should resolve, because business is registered", async () => {
                const actual = businessUpdateBuilder
                    .businessUpdateAsset(businessUpdateAsset1)
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    businessUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).toResolve();
            });

            it("should throw BusinessIsResignedError, because business is resigned", async () => {
                const businessResignation = businessResignationBuilder
                    .nonce("2")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await businessResignationHandler.applyToSender(businessResignation.build(), walletManager);

                const actual = businessUpdateBuilder
                    .businessUpdateAsset(businessUpdateAsset1)
                    .nonce("3")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(
                    businessUpdateHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
                ).rejects.toThrowError(BusinessIsResignedError);


            });
        });


    });

});
