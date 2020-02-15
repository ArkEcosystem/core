import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import {
    Builders as MagistrateBuilders,
    Interfaces as MagistrateInterfaces,
} from "@arkecosystem/core-magistrate-crypto";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { BusinessAlreadyRegisteredError } from "../../../../packages/core-magistrate-transactions/src/errors";
import { BusinessRegistrationTransactionHandler } from "../../../../packages/core-magistrate-transactions/src/handlers";
import { IBusinessWalletAttributes } from "../../../../packages/core-magistrate-transactions/src/interfaces";
import { businessRegistrationAsset1 } from "../helper";

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

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Business registration handler", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();

        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("5000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();
        });

        it("should reject because wallet is already a business", async () => {
            senderWallet.setAttribute<MagistrateInterfaces.IBusinessRegistrationAsset>(
                "business.businessAsset",
                businessRegistrationAsset1,
            );

            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).rejects.toThrowError(BusinessAlreadyRegisteredError);
        });

        it("should reject business registration when resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toReject();
        });
    });

    describe("applyToSender", () => {
        it("should not fail", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(businessRegistrationHandler.applyToSender(actual.build(), walletManager)).toResolve();
        });

        it("should get correct wallet", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);

            const wallet = walletManager.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey);

            expect(wallet).toStrictEqual(senderWallet);
        });
    });

    describe("revertForSender", () => {
        it("should not fail", async () => {
            senderWallet.setAttribute<IBusinessWalletAttributes>("business", {
                businessAsset: businessRegistrationAsset1,
            });
            senderWallet.nonce = Utils.BigNumber.make(1);
            walletManager.reindex(senderWallet);
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(businessRegistrationHandler.revertForSender(actual.build(), walletManager)).toResolve();
        });

        it("should be undefined", async () => {
            senderWallet.setAttribute<IBusinessWalletAttributes>("business", {
                businessAsset: businessRegistrationAsset1,
            });
            senderWallet.nonce = Utils.BigNumber.make(1);
            walletManager.reindex(senderWallet);

            const initialWallet = walletManager.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey);
            expect(initialWallet).toBe(senderWallet);

            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);

            const walletByIndexAfterRevert = walletManager.findByIndex(
                MagistrateIndex.Businesses,
                senderWallet.publicKey,
            );
            expect(walletByIndexAfterRevert).toBeUndefined();
            expect(initialWallet.getAttribute("business")).toBeUndefined();
        });
    });
});
