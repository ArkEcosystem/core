import { CryptoSuite } from "@arkecosystem/core-crypto";

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

const createFactory = (cryptoSuite?: CryptoSuite.CryptoSuite): FactoryBuilder => {
    const factory: FactoryBuilder = new FactoryBuilder(cryptoSuite);

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
export const factory = (name: string, cryptoSuite?: CryptoSuite.CryptoSuite): Factory =>
    createFactory(cryptoSuite).get(name);
