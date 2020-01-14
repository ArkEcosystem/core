import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../../../../packages/core-magistrate-transactions/src/errors";

import {
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
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

// Handlers declaration
let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;

// Builders declaration
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

    // Handlers registry
    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);

    beforeEach(() => {
        // Handler initialization
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();

        // Builder initialization
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

    describe("Tests with business registered",()=>{

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

            await businessResignationHandler.applyToSender(resignationPass.build(), walletManager);

            const resignationThrow = businessResignationBuilder
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(resignationThrow.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessIsResignedError);

        });

    });

});
