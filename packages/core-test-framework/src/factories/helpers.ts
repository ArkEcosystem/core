import { Blocks } from "@arkecosystem/core-crypto";

import {
    registerBlockFactory,
    registerIdentityFactory,
    registerPeerFactory,
    registerRoundFactory,
    registerTransactionFactory,
    registerWalletFactory,
} from "./factories";
import { Factory } from "./factory";
import { FactoryBuilder } from "./factory-builder";

const createFactory = (blockFactory: Blocks.BlockFactory): FactoryBuilder => {
    const factory: FactoryBuilder = new FactoryBuilder(blockFactory);

    registerBlockFactory(factory);

    registerIdentityFactory(factory);

    registerPeerFactory(factory);

    registerRoundFactory(factory);

    registerTransactionFactory(factory);

    registerWalletFactory(factory);

    return factory;
};
/**
 * This serves as a helper function to quickly access a factory
 * without having to perform all the manual registrations.
 *
 * @param {string} name
 * @returns {FactoryBuilder}
 */
export const factory = (name: string, blockFactory: Blocks.BlockFactory): Factory =>
    createFactory(blockFactory).get(name);
