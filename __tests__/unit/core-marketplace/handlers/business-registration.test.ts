import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../../packages/core-marketplace/src/builders";
import { BusinessAlreadyRegisteredError } from "../../../../packages/core-marketplace/src/errors";
import { BusinessRegistrationTransactionHandler } from "../../../../packages/core-marketplace/src/handlers";
import {
    IBusinessRegistrationAsset,
    IBusinessWalletAttributes,
} from "../../../../packages/core-marketplace/src/interfaces";
import { businessIndexer, MarketplaceIndex } from "../../../../packages/core-marketplace/src/wallet-manager";
import { businessRegistrationAsset1 } from "../helper";

let businessRegistrationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: BusinessRegistrationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("Business registration handler", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();

        businessRegistrationBuilder = new BusinessRegistrationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MarketplaceIndex.Businesses, businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(4527654311);
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("500000000")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();
        });

        it("should reject because wallet is already a business", async () => {
            senderWallet.setAttribute<IBusinessRegistrationAsset>("business.businessAsset", businessRegistrationAsset1);

            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("100")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessAlreadyRegisteredError);
        });

        it("should resolve because business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("100")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();
        });
    });

    describe("applyToSender", () => {
        it("should not fail", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("1200")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(businessRegistrationHandler.applyToSender(actual.build(), walletManager)).toResolve();
        });

        it("should get correct wallet", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("1200")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);

            const wallet = walletManager.findByIndex(
                MarketplaceIndex.Businesses,
                senderWallet.getAttribute<IBusinessWalletAttributes>("business").businessId.toFixed(),
            );

            expect(wallet).toStrictEqual(senderWallet);
        });
    });

    describe("revertForSender", () => {
        it("should not fail", async () => {
            senderWallet.setAttribute<IBusinessWalletAttributes>("business", {
                businessId: Utils.BigNumber.ONE,
                businessAsset: businessRegistrationAsset1,
            });
            senderWallet.nonce = Utils.BigNumber.make(1);
            walletManager.reindex(senderWallet);
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("1200")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(businessRegistrationHandler.revertForSender(actual.build(), walletManager)).toResolve();
        });

        it("should be undefined", async () => {
            senderWallet.setAttribute<IBusinessWalletAttributes>("business", {
                businessId: Utils.BigNumber.ONE,
                businessAsset: businessRegistrationAsset1,
            });
            senderWallet.nonce = Utils.BigNumber.make(1);
            walletManager.reindex(senderWallet);

            let wallet = walletManager.findByIndex(MarketplaceIndex.Businesses, "1");
            expect(wallet).toBe(senderWallet);

            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .fee("1200")
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);

            wallet = walletManager.findByIndex(MarketplaceIndex.Businesses, "1");
            expect(wallet.getAttribute("business")).toBeUndefined();
        });
    });
});
