import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { businessIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import {
    BusinessAlreadyRegisteredError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import {
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { IBusinessWalletAttributes } from "../../../../packages/core-magistrate-transactions/src/interfaces";
import { businessRegistrationAsset1, businessRegistrationAsset2 } from "../helper";

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
let businessResignationHandler: Handlers.TransactionHandler;

let businessRegistrationBuilder: MagistrateBuilders.BusinessRegistrationBuilder;
let businessResignationBuilder: MagistrateBuilders.BusinessResignationBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("should test marketplace transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
    Handlers.Registry.registerTransactionHandler(BusinessUpdateTransactionHandler);

    beforeEach(() => {
        businessRegistrationHandler = new BusinessRegistrationTransactionHandler();
        businessResignationHandler = new BusinessResignationTransactionHandler();

        businessRegistrationBuilder = new MagistrateBuilders.BusinessRegistrationBuilder();
        businessResignationBuilder = new MagistrateBuilders.BusinessResignationBuilder();

        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Businesses, businessIndexer);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("50000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("should test business registration handler", () => {
        it("should pass all handler methods", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletAttributes>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual(businessRegistrationAsset1);

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should pass all handler methods, with name, website, vat and repository", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessRegistrationHandler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager),
            ).toResolve();

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<IBusinessWalletAttributes>("business");
            expect(currentSenderWallet.businessAsset).toStrictEqual(businessRegistrationAsset2);

            await businessRegistrationHandler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("business")).toBeFalse();
        });

        it("should fail duo to wallet already a business error", async () => {
            const actual = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await businessRegistrationHandler.applyToSender(actual.build(), walletManager);

            actual.nonce("2");
            await expect(businessRegistrationHandler.applyToSender(actual.build(), walletManager)).rejects.toThrowError(
                BusinessAlreadyRegisteredError,
            );
        });
    });

    describe("should test business resignation handler", () => {
        it("should fail, because business is not registered", async () => {
            const actual = businessResignationBuilder
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(businessResignationHandler.applyToSender(actual.build(), walletManager)).rejects.toThrowError(
                BusinessIsNotRegisteredError,
            );
        });

        it("should pass, because business is registered", async () => {
            const businessRegister = businessRegistrationBuilder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            const businessResignation = businessResignationBuilder
                .nonce("2")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(
                businessRegistrationHandler.applyToSender(businessRegister.build(), walletManager),
            ).toResolve();
            await expect(
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).toResolve();

            businessResignation.nonce("3");
            await expect(
                businessResignationHandler.applyToSender(businessResignation.build(), walletManager),
            ).rejects.toThrowError(BusinessIsResignedError);
        });
    });
});
