import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import {
    MagistrateTransactionGroup,
    MagistrateTransactionType,
} from "@arkecosystem/core-magistrate-crypto";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";

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
            Handlers.Registry.get(MagistrateTransactionType.BusinessRegistration, MagistrateTransactionGroup);
            Handlers.Registry.get(MagistrateTransactionType.BusinessResignation, MagistrateTransactionGroup);
            Handlers.Registry.get(MagistrateTransactionType.BridgechainRegistration, MagistrateTransactionGroup);
            Handlers.Registry.get(MagistrateTransactionType.BridgechainResignation, MagistrateTransactionGroup);
            Handlers.Registry.get(MagistrateTransactionType.BusinessUpdate, MagistrateTransactionGroup);
            Handlers.Registry.get(MagistrateTransactionType.BridgechainUpdate, MagistrateTransactionGroup);
        }).not.toThrowError();
    });
});
