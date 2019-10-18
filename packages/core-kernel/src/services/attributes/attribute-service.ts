import { strict } from "assert";

import { injectable } from "../../ioc";
import { AttributeIndex } from "./attribute-index";
import { IndexOptions } from "./contracts";

@injectable()
export class AttributeService {
    /**
     * @private
     * @type {Map<string, AttributeIndex>}
     * @memberof AttributeService
     */
    private readonly scopes: Map<string, Map<string, AttributeIndex>> = new Map<string, Map<string, AttributeIndex>>();

    /**
     * @param {string} name
     * @param {IndexOptions} options
     * @returns {AttributeIndex}
     * @memberof AttributeService
     */
    public get(name: string, options: IndexOptions = { scope: "default" }): AttributeIndex {
        const scope: Map<string, AttributeIndex> = this.scope(options.scope);

        strict.strictEqual(scope.has(name), true, `Tried to get an unknown index: ${name}`);

        return scope.get(name);
    }

    /**
     * @param {string} name
     * @param {IndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public set(name: string, options: IndexOptions = { scope: "default" }): boolean {
        const scope: Map<string, AttributeIndex> = this.scope(options.scope);

        strict.strictEqual(scope.has(name), false, `Tried to set a known index: ${name}`);

        scope.set(name, new AttributeIndex());

        return scope.has(name);
    }

    /**
     * @param {string} name
     * @param {IndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public forget(name: string, options: IndexOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).delete(name);
    }

    /**
     * @param {string} name
     * @param {IndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public has(name: string, options: IndexOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).has(name);
    }

    private scope(name: string) {
        if (this.scopes.has(name)) {
            return this.scopes.get(name);
        }

        this.scopes.set(name, new Map<string, AttributeIndex>());

        return this.scopes.get(name);
    }
}
