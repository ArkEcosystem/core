import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "../../../src/handlers";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";

describe("Registry test", () => {
    Managers.configManager.setFromPreset("testnet");

    it("should not throw when registering market place transactions", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessUpdateTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainUpdateTransactionHandler);

        expect(() => {
            Handlers.Registry.get(MarketplaceTransactionTypes.BusinessRegistration, MarketplaceTransactionsGroup);
            Handlers.Registry.get(MarketplaceTransactionTypes.BusinessResignation, MarketplaceTransactionsGroup);
            Handlers.Registry.get(MarketplaceTransactionTypes.BridgechainRegistration, MarketplaceTransactionsGroup);
            Handlers.Registry.get(MarketplaceTransactionTypes.BridgechainResignation, MarketplaceTransactionsGroup);
            Handlers.Registry.get(MarketplaceTransactionTypes.BusinessUpdate, MarketplaceTransactionsGroup);
            Handlers.Registry.get(MarketplaceTransactionTypes.BridgechainUpdate, MarketplaceTransactionsGroup);
        }).not.toThrowError();
    });
});
