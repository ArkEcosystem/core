import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder, BusinessResignationBuilder } from "../../../src/builders";
import { BusinessIsNotRegisteredError } from "../../../src/errors";
import { BusinessRegistrationTransactionHandler, BusinessResignationTransactionHandler } from "../../../src/handlers";
import { businessIndexer } from "../../../src/wallet-manager";

// @ts-ignore
let businessRegistrationHandler: Handlers.TransactionHandler;
let businessResignationHandler: Handlers.TransactionHandler;

// @ts-ignore
let businessRegistrationBuilder: BusinessRegistrationBuilder;
let businessResignationBuilder: BusinessResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("Business resignation handler", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();

        businessRegistrationBuilder = new BusinessRegistrationBuilder();
        businessResignationBuilder = new BusinessResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex("byBusiness", businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654312);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should throw BusinessIsNotRegisteredError", async () => {
            const actual = businessResignationBuilder
                .fee("100")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessResignationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessIsNotRegisteredError);
        });
    });
});
