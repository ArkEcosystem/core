import { strictEqual } from "assert";

import { injectable } from "../../ioc";
import { assert } from "../../utils";
import { AttributeIndex } from "./attribute-index";

interface AttributeIndexOptions {
    scope: string;
}

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
     * @param {AttributeIndexOptions} options
     * @returns {AttributeIndex}
     * @memberof AttributeService
     */
    public get(name: string, options: AttributeIndexOptions = { scope: "default" }): AttributeIndex {
        return assert.defined(this.scope(options.scope).get(name), `Tried to get an unknown index: ${name}`);
    }

    /**
     * @param {string} name
     * @param {AttributeIndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public set(name: string, options: AttributeIndexOptions = { scope: "default" }): boolean {
        const scope: Map<string, AttributeIndex> = this.scope(options.scope);

        strictEqual(scope.has(name), false, `Tried to set a known index: ${name}`);

        scope.set(name, new AttributeIndex());

        return scope.has(name);
    }

    /**
     * @param {string} name
     * @param {AttributeIndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public forget(name: string, options: AttributeIndexOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).delete(name);
    }

    /**
     * @param {string} [name]
     * @returns {boolean}
     * @memberof AttributeService
     */
    public flush(name?: string): boolean {
        const scope: Map<string, Map<string, AttributeIndex>> | Map<string, AttributeIndex> = name
            ? this.scope(name)
            : this.scopes;

        scope.clear();

        return scope.size === 0;
    }

    /**
     * @param {string} name
     * @param {AttributeIndexOptions} options
     * @returns {boolean}
     * @memberof AttributeService
     */
    public has(name: string, options: AttributeIndexOptions = { scope: "default" }): boolean {
        return this.scope(options.scope).has(name);
    }

    /**
     * @private
     * @param {string} name
     * @returns {Map<string, AttributeIndex>}
     * @memberof AttributeService
     */
    private scope(name: string): Map<string, AttributeIndex> {
        if (!this.scopes.has(name)) {
            this.scopes.set(name, new Map<string, AttributeIndex>());
        }

        return assert.defined(this.scopes.get(name));
    }
}
