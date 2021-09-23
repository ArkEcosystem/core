"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const defaults_1 = require("./defaults");
const handlers_1 = require("./handlers");
const wallet_manager_1 = require("./wallet-manager");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "core-magistrate-transactions",
    async register(container, options) {
        const logger = container.resolvePlugin("logger");
        logger.info("Setting up core-magistrate-transactions.");
        container
            .resolvePlugin("event-emitter")
            .once(core_event_emitter_1.ApplicationEvents.StateStarting, (database) => {
            const walletManager = database.walletManager;
            walletManager.registerIndex(wallet_manager_1.MagistrateIndex.Businesses, wallet_manager_1.businessIndexer);
        });
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BusinessRegistrationTransactionHandler);
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BusinessResignationTransactionHandler);
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BusinessUpdateTransactionHandler);
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BridgechainRegistrationTransactionHandler);
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BridgechainResignationTransactionHandler);
        core_transactions_1.Handlers.Registry.registerTransactionHandler(handlers_1.BridgechainUpdateTransactionHandler);
    },
    // tslint:disable-next-line: no-empty
    async deregister(container, options) { },
};
//# sourceMappingURL=plugin.js.map