import { container } from "./mocks/core-container";

import { Handlers as MagistrateHandlers } from "@arkecosystem/core-magistrate-transactions";
import { Handlers } from "@arkecosystem/core-transactions";
import { dynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee";
import { transactionPoolConfig } from "./fixtures/transaction-pool";
import { dynamicFeeTxs, staticFeeTxs } from "./fixtures/transactions";

Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessRegistrationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessResignationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessUpdateTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainRegistrationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainResignationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainUpdateTransactionHandler);

const staticTestFixtures = Object.entries(staticFeeTxs);
const dynamicTestFixtures = Object.entries(dynamicFeeTxs);

describe("static fees", () => {
    beforeEach(() => {
        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...transactionPoolConfig,
            ...{ dynamicFees: { enabled: false } },
        });
    });

    it.each(staticTestFixtures)(
        "should result in broadcast and enterPool being true for %s with high enough fee",
        async (_, transactionInstance) => {
            const dynFeeResult = await dynamicFeeMatcher(transactionInstance);
            expect(dynFeeResult.broadcast).toBeTrue();
            expect(dynFeeResult.enterPool).toBeTrue();
        },
    );

    it.each(dynamicTestFixtures)(
        "should result in broadcast and enterPool being false for %s with too low fee",
        async (_, transactionInstance) => {
            const dynFeeResult = await dynamicFeeMatcher(transactionInstance);
            expect(dynFeeResult.broadcast).toBeFalse();
            expect(dynFeeResult.enterPool).toBeFalse();
        },
    );
});

describe("dynamic fees", () => {
    const dynamicFeeConfig = transactionPoolConfig.dynamicFees;

    beforeEach(() => {
        jest.spyOn(container.app, "resolveOptions").mockReturnValue({
            ...transactionPoolConfig,
            ...{ dynamicFees: { ...transactionPoolConfig.dynamicFees, ...{ enabled: true } } },
        });
    });

    it.each(dynamicTestFixtures)(
        "should result in broadcast and enterPool being true for %s with high enough fee",
        async (_, transactionInstance) => {
            // we manually tweak the fee so that it matches the minimum dynamic fee allowed

            const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
                transactionInstance.key
            ];

            const handler = await Handlers.Registry.get(transactionInstance.type);
            transactionInstance.data.fee = handler.dynamicFee({
                transaction: transactionInstance,
                addonBytes,
                satoshiPerByte: dynamicFeeConfig.minFeeBroadcast,
                height: 1,
            });

            const dynFeeResult = await dynamicFeeMatcher(transactionInstance);
            expect(dynFeeResult.broadcast).toBeTrue();
            expect(dynFeeResult.enterPool).toBeTrue();
        },
    );

    it.each(dynamicTestFixtures)(
        "should result in broadcast and enterPool being false for %s with too low fee",
        async (_, transactionInstance) => {
            // we manually tweak the fee so that it is just lower than the minimum dynamic fee allowed

            const addonBytes: number = (container.app.resolveOptions() as any).dynamicFees.addonBytes[
                transactionInstance.key
            ];

            const handler = await Handlers.Registry.get(transactionInstance.type);
            transactionInstance.data.fee = handler
                .dynamicFee({
                    transaction: transactionInstance,
                    addonBytes,
                    satoshiPerByte: dynamicFeeConfig.minFeeBroadcast,
                    height: 1,
                })
                .minus(1);

            const dynFeeResult = await dynamicFeeMatcher(transactionInstance);
            expect(dynFeeResult.broadcast).toBeFalse();
            expect(dynFeeResult.enterPool).toBeFalse();
        },
    );
});
