import { app } from "@arkecosystem/core-container";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { defaults } from "./defaults";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "./handlers";
import { bridgechainIndexer, businessIndexer, MarketplaceIndex } from "./wallet-manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "core-marketplace",
    async register(container: Container.IContainer, options) {
        const logger = container.resolvePlugin<Logger.ILogger>("logger");
        logger.info("Setting up core-marketplace.");

        const walletManager = app.resolvePlugin("database").walletManager;
        walletManager.registerIndex(MarketplaceIndex.Businesses, businessIndexer);
        walletManager.registerIndex(MarketplaceIndex.Bridgechains, bridgechainIndexer);

        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessUpdateTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainUpdateTransactionHandler);
    },

    // tslint:disable-next-line: no-empty
    async deregister(container: Container.IContainer, options) {},
};
