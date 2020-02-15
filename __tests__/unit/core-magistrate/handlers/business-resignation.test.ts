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
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { businessRegistrationAsset1 } from "../helper";

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

// Builder declarations
let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let businessResignationBuilder: MagistrateBuilders.BusinessResignationBuilder;

// Sender Wallet declaration
let senderWallet: Wallets.Wallet;

// Wallet Manager declaration
let walletManager: State.IWalletManager;


describe("Business resignation handler", () => {
    // Manager configurations
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

    // Handlers registries
    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);

    beforeEach(() => {
        // Handler initializations
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();

        // Builder initializations
        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        businessResignationBuilder = new MagistrateBuilders.BusinessResignationBuilder();

        // Wallet Manager initialization
        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        // Sender Wallet initialization
        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(45276543120);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        walletManager.reindex(senderWallet);
    });

    it("should throw BusinessIsNotRegisteredError, because business is not registered", async () => {
        const actual = businessResignationBuilder
            .fee("100")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

        await expect(
            businessResignationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
        ).rejects.toThrowError(BusinessIsNotRegisteredError);
    });

    describe("Business registered tests",()=>{

        let registeredTransaction;

        beforeEach(async () =>{

            registeredTransaction = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.applyToSender(registeredTransaction.build(), walletManager);

        });

        it("should pass throwIfCannotBeApplied, because business is registered", async ()=> {

            const actual = businessResignationBuilder
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();


        });

        it("should throw BusinessIsResignedError, because wallet already resigned once", async ()=> {

            const resignationPass = businessResignationBuilder
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(businessResignationHandler.applyToSender(resignationPass.build(), walletManager)).toResolve();

            const resignationThrow = businessResignationBuilder
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(resignationThrow.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessIsResignedError);

        });

        it("should have property business.resigned equal to true", async ()=> {

            const actual = businessResignationBuilder
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessResignationHandler.applyToSender(actual.build(), walletManager);

            expect(senderWallet.getAttribute("business.resigned")).toBeTrue();
        });

    });

});
