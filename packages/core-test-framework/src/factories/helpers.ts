import { CryptoManager } from "@arkecosystem/core-crypto";
import memoize from "fast-memoize";

import { defaultSchemaValidator } from "../utils/schema-validator";
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

const createFactory = memoize(
    (cryptoManager: CryptoManager, validator): FactoryBuilder => {
        const factory: FactoryBuilder = new FactoryBuilder(cryptoManager, validator);

        registerBlockFactory(factory);

        registerIdentityFactory(factory);

        registerPeerFactory(factory);

        registerRoundFactory(factory);

        registerTransactionFactory(factory);

        registerWalletFactory(factory);

        return factory;
    },
);

/**
 * This serves as a helper function to quickly access a factory
 * without having to perform all the manual registrations.
 *
 * @param {string} name
 * @returns {FactoryBuilder}
 */
export const factory = (
    name: string,
    cryptoManager: CryptoManager = CryptoManager.createFromPreset("testnet"),
    validator = defaultSchemaValidator,
): Factory => createFactory(cryptoManager, validator).get(name);
