import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import {
    MarketplaceTransactionGroup,
    MarketplaceTransactionType,
} from "../../../../packages/core-marketplace/src/enums";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "../../../../packages/core-marketplace/src/handlers";

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
            Handlers.Registry.get(MarketplaceTransactionType.BusinessRegistration, MarketplaceTransactionGroup);
            Handlers.Registry.get(MarketplaceTransactionType.BusinessResignation, MarketplaceTransactionGroup);
            Handlers.Registry.get(MarketplaceTransactionType.BridgechainRegistration, MarketplaceTransactionGroup);
            Handlers.Registry.get(MarketplaceTransactionType.BridgechainResignation, MarketplaceTransactionGroup);
            Handlers.Registry.get(MarketplaceTransactionType.BusinessUpdate, MarketplaceTransactionGroup);
            Handlers.Registry.get(MarketplaceTransactionType.BridgechainUpdate, MarketplaceTransactionGroup);
        }).not.toThrowError();
    });
});
