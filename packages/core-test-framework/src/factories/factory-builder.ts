import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";
import { strictEqual } from "assert";

import { defaultSchemaValidator } from "../utils/schema-validator";
import { Factory } from "./factory";
import { FactoryFunction } from "./types";

/**
 * @export
 * @class FactoryBuilder
 */
export class FactoryBuilder<T, U extends Interfaces.ITransactionData, E> {
    public transactionManager: Transactions.TransactionsManager<T, U, E>;

    /**
     * @private
     * @type {Record<string, Factory>}
     * @memberof FactoryBuilder
     */
    private readonly factories: Map<string, Factory> = new Map<string, Factory>();

    public constructor(public cryptoManager: CryptoManager<T>, validator = defaultSchemaValidator) {
        this.transactionManager = new Transactions.TransactionsManager(cryptoManager, validator);
    }

    /**
     * @param {string} factory
     * @returns {Factory}
     * @memberof FactoryBuilder
     */
    public get(factory: string): Factory {
        strictEqual(this.factories.has(factory), true, `The [${factory}] factory is unknown.`);

        return this.factories.get(factory) as Factory;
    }

    /**
     * @param {string} factory
     * @param {FactoryFunction} fn
     * @returns {boolean}
     * @memberof FactoryBuilder
     */
    public set(factory: string, fn: FactoryFunction): boolean {
        const instance: Factory = new Factory();
        instance.state("default", fn);

        this.factories.set(factory, instance);

        return this.factories.has(factory);
    }
}
