import { strict } from "assert";

import { injectable } from "../../ioc";
import { AttributeIndex } from "./attribute-index";

@injectable()
export class AttributeService {
    /**
     * @private
     * @type {Map<string, AttributeIndex>}
     * @memberof AttributeService
     */
    private readonly indexes: Map<string, AttributeIndex> = new Map<string, AttributeIndex>();

    /**
     * @param {string} name
     * @returns {AttributeIndex}
     * @memberof AttributeService
     */
    public get(name: string): AttributeIndex {
        strict.strictEqual(this.indexes.has(name), true, `Tried to get an unknown index: ${name}`);

        return this.indexes.get(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof AttributeService
     */
    public set(name: string): boolean {
        strict.strictEqual(this.indexes.has(name), false, `Tried to set a known index: ${name}`);

        this.indexes.set(name, new AttributeIndex());

        return this.indexes.has(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof AttributeService
     */
    public forget(name: string): boolean {
        return this.indexes.delete(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof AttributeService
     */
    public has(name: string): boolean {
        return this.indexes.has(name);
    }
}
