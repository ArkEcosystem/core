import "jest-extended";

import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Registry test", () => {
    Managers.configManager.setFromPreset("testnet");

    it("should not throw when registering magistrate transactions", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainResignationTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BusinessUpdateTransactionHandler);
        Handlers.Registry.registerTransactionHandler(BridgechainUpdateTransactionHandler);

        expect(() => {
            Handlers.Registry.get(
                Enums.MagistrateTransactionType.BusinessRegistration,
                Enums.MagistrateTransactionGroup,
            );
            Handlers.Registry.get(
                Enums.MagistrateTransactionType.BusinessResignation,
                Enums.MagistrateTransactionGroup,
            );
            Handlers.Registry.get(
                Enums.MagistrateTransactionType.BridgechainRegistration,
                Enums.MagistrateTransactionGroup,
            );
            Handlers.Registry.get(
                Enums.MagistrateTransactionType.BridgechainResignation,
                Enums.MagistrateTransactionGroup,
            );
            Handlers.Registry.get(Enums.MagistrateTransactionType.BusinessUpdate, Enums.MagistrateTransactionGroup);
            Handlers.Registry.get(Enums.MagistrateTransactionType.BridgechainUpdate, Enums.MagistrateTransactionGroup);
        }).not.toThrowError();
    });
});
