import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { CryptoManager } from "@arkecosystem/crypto";
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
    (cryptoManager: CryptoManager<BlockInterfaces.IBlockData>, validator = defaultSchemaValidator): FactoryBuilder => {
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
    cryptoManager: CryptoManager<BlockInterfaces.IBlockData> = CryptoManager.createFromPreset("testnet"),
    validator = defaultSchemaValidator,
): Factory => createFactory(cryptoManager, validator).get(name);
