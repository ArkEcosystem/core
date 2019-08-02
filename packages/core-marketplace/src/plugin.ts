import { app } from "@arkecosystem/core-container";
import { Container, Logger, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { defaults } from "./defaults";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "./handlers";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "core-marketplace",
    async register(container: Container.IContainer, options) {
        container
            .resolvePlugin<Logger.ILogger>("logger")
            .info("Setting up wallet manager for business transaction types");

        const walletManager = app.resolvePlugin("database").walletManager;
        walletManager.registerIndex("byBusiness", (index: State.IWalletIndex, wallet: State.IWallet): void => {
            if (wallet.hasAttribute("business") && wallet.publicKey) {
                index.set(wallet.publicKey, wallet);
            }
        });

        container.resolvePlugin<Logger.ILogger>("logger").info("Registering marketplace transactions");
        Handlers.Registry.registerCustomTransactionHandler(BusinessRegistrationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BusinessResignationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BridgechainRegistrationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BridgechainResignationTransactionHandler);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Deregister core-marketplace");
    },
};
