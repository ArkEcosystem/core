import { Errors, Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import "jest-extended";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "../../../src/handlers";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";

describe("Registry test", () => {
    Managers.configManager.setFromPreset("testnet");

    it("should not throw when registering market place transactions", () => {
        Handlers.Registry.registerCustomTransactionHandler(BusinessRegistrationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BusinessResignationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BridgechainRegistrationTransactionHandler);
        Handlers.Registry.registerCustomTransactionHandler(BridgechainResignationTransactionHandler);

        expect(() => {
            Handlers.Registry.get(MarketplaceTransactionTypes.BusinessRegistration);
            Handlers.Registry.get(MarketplaceTransactionTypes.BusinessResignation);
            Handlers.Registry.get(MarketplaceTransactionTypes.BridgechainRegistration);
            Handlers.Registry.get(MarketplaceTransactionTypes.BridgechainResignation);
        }).not.toThrow(Errors.InvalidTransactionTypeError);
    });
});
