import { strict } from "assert";
import get from "get-value";
import has from "has-value";
import set from "set-value";
import unset from "unset-value";
import { Primitive } from "../../types";

export class AttributeIndex {
    /**
     * @private
     * @type {Record<string, any>}
     * @memberof AttributeIndex
     */
    private readonly attributes: Record<string, Primitive> = {};

    /**
     * @private
     * @type {Set<string>}
     * @memberof AttributeIndex
     */
    private readonly knownAttributes: Set<string> = new Set<string>();

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public bind(attribute: string): boolean {
        if (this.knownAttributes.has(attribute)) {
            return false;
        }

        this.knownAttributes.add(attribute);

        return this.knownAttributes.has(attribute);
    }

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public unbind(attribute: string): boolean {
        if (!this.knownAttributes.has(attribute)) {
            return false;
        }

        this.knownAttributes.delete(attribute);

        return !this.knownAttributes.has(attribute);
    }

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public isBound(attribute: string): boolean {
        return this.knownAttributes.has(attribute);
    }

    /**
     * @template T
     * @param {string} id
     * @param {string} attribute
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof AttributeIndex
     */
    public get<T>(id: string, attribute: string, defaultValue?: T): T {
        this.assertKnown(attribute);

        return get(this.attributes, `${id}.${attribute}`, defaultValue);
    }

    /**
     * @template T
     * @param {string} id
     * @param {string} attribute
     * @param {T} value
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public set<T>(id: string, attribute: string, value: T): boolean {
        this.assertKnown(attribute);

        set(this.attributes, `${id}.${attribute}`, value);

        return this.has(id, attribute);
    }

    /**
     * @param {string} id
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public forget(id: string, attribute: string): boolean {
        this.assertKnown(attribute);

        unset(this.attributes, `${id}.${attribute}`);

        return this.has(id, attribute);
    }

    /**
     * @param {string} id
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public has(id: string, attribute: string): boolean {
        this.assertKnown(attribute);

        return has(this.attributes, `${id}.${attribute}`);
    }

    /**
     * @private
     * @param {string} attribute
     * @memberof AttributeIndex
     */
    private assertKnown(attribute: string): void {
        strict.strictEqual(
            this.knownAttributes.has(attribute),
            true,
            `Tried to access an unknown attribute: ${attribute}`,
        );
    }
}
