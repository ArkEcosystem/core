import { Wallets } from "@arkecosystem/core-state";
import { Managers, Utils } from "@arkecosystem/crypto";
import "jest-extended";

describe("BusinessRegistration transaction", () => {
    describe("throwIfCannotBeApplied", () => {
        it("a", () => {
            Managers.configManager.setFromPreset("testnet");
            const businessWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
            businessWallet.balance = Utils.BigNumber.make(50000000);
        });
    });
});
