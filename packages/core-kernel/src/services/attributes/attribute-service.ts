import { strictEqual } from "assert";

import { injectable } from "../../ioc";
import { assert } from "../../utils";
import { AttributeMap } from "./attribute-map";
import { AttributeSet } from "./attribute-set";

interface AttributeMapOptions {
    scope: string;
}

@injectable()
export class AttributeService {
    /**
     * @private
     * @type {Map<string, Map<string, AttributeMap>>}
     * @memberof AttributeService
     */
    private readonly scopes: Map<string, Map<string, AttributeMap>> = new Map<string, Map<string, AttributeMap>>();

    /**
     * @param {string} name
     * @param {AttributeMapOptions} [options={ scope: "default" }]
     * @returns {AttributeMap}
     * @memberof AttributeService
     */
    public get(name: string, options: AttributeMapOptions = { scope: "default" }): AttributeMap {
        return assert.defined(this.scope(options.scope).get(name), `Unknown index: ${name}`);
    }

    /**
     * @param {string} name
     * @param {AttributeSet} knownAttributes
     * @param {AttributeMapOptions} [options={ scope: "default" }]
     * @returns {boolean}
     * @memberof AttributeService
     */
    public set(
        name: string,
        knownAttributes: AttributeSet,
        options: AttributeMapOptions = { scope: "default" },
    ): boolean {
        const scope: Map<string, AttributeMap> = this.scope(options.scope);

        strictEqual(scope.has(name), false, `Duplicate index: ${name}`);

        scope.set(name, new AttributeMap(knownAttributes));

        return scope.has(name);
    }

    /**
     * @param {string} name
     * @param {AttributeMapOptions} [options={ scope: "default" }]
     * @returns {boolean}
     * @memberof AttributeService
     */
    public forget(name: string, options: AttributeMapOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).delete(name);
    }

    /**
     * @param {string} [name]
     * @returns {boolean}
     * @memberof AttributeService
     */
    public flush(name?: string): boolean {
        const scope: Map<string, Map<string, AttributeMap>> | Map<string, AttributeMap> = name
            ? this.scope(name)
            : this.scopes;

        scope.clear();

        return scope.size === 0;
    }

    /**
     * @param {string} name
     * @param {AttributeMapOptions} [options={ scope: "default" }]
     * @returns {boolean}
     * @memberof AttributeService
     */
    public has(name: string, options: AttributeMapOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).has(name);
    }

    /**
     * @private
     * @param {string} name
     * @returns {Map<string, AttributeMap>}
     * @memberof AttributeService
     */
    private scope(name: string): Map<string, AttributeMap> {
        if (!this.scopes.has(name)) {
            this.scopes.set(name, new Map<string, AttributeMap>());
        }

        return assert.defined(this.scopes.get(name));
    }
}
