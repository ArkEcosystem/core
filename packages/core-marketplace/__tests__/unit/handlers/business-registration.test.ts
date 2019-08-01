import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../src/builders";
import { BusinessRegistrationTransactionHandler } from "../../../src/handlers";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";

let handler: Handlers.TransactionHandler;
let builder: BusinessRegistrationBuilder;
let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("test", () => {
    Managers.configManager.setFromPreset("testnet");
    Handlers.Registry.registerCustomTransactionHandler(BusinessRegistrationTransactionHandler);

    beforeEach(() => {
        handler = Handlers.Registry.get(MarketplaceTransactionTypes.BusinessRegistration);
        builder = new BusinessRegistrationBuilder();
        walletManager = new Wallets.WalletManager();
        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654310);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        walletManager.reindex(senderWallet);
        (walletManager as any).businessWalletAddress = [];
    });

    it("should", () => {
        const actual = builder
            .businessRegistrationAsset({
                name: "businessName",
                website: "www.website.com",
            })
            .fee("50000000")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
        handler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager);
    });
});
