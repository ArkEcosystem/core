import { cloneDeep, get, has, isObject, set, unset } from "@arkecosystem/utils";
import { strict } from "assert";

type AttributeIndexKey = number | object | string;

export class AttributeIndex {
    /**
     * @private
     * @type {Map<string | number, object>}
     * @memberof AttributeIndex
     */
    private readonly attributes: Map<string | number, object> = new Map<string | number, object>();

    /**
     * @private
     * @type {WeakMap<object, object>}
     * @memberof AttributeIndex
     */
    private attributesWeak: WeakMap<object, object> = new WeakMap<object, object>();

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
    public get<T>(id: AttributeIndexKey, attribute: string, defaultValue?: T): T {
        this.assertKnown(attribute);

        return get(this.getCollection(id), attribute, defaultValue);
    }

    /**
     * @template T
     * @param {string} id
     * @param {string} attribute
     * @param {T} value
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public set<T>(id: AttributeIndexKey, attribute: string, value: T): boolean {
        this.assertKnown(attribute);

        const collection: any = isObject(id) ? this.attributesWeak : this.attributes;

        if (!collection.has(id)) {
            collection.set(id, {});
        }

        set(collection.get(id), attribute, value);

        return this.has(id, attribute);
    }

    /**
     * @param {AttributeIndexKey} id
     * @param {string} [attribute]
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public forget(id: AttributeIndexKey, attribute?: string): boolean {
        if (attribute) {
            this.assertKnown(attribute);

            unset(this.getCollection(id), attribute);
        } else {
            isObject(id) ? this.attributesWeak.delete(id) : this.attributes.delete(id);
        }

        return this.has(id, attribute);
    }

    /**
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public flush(): boolean {
        this.attributes.clear();

        this.attributesWeak = new WeakMap<object, object>();

        return this.attributes.size === 0;
    }

    /**
     * @param {string} id
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public has(id: AttributeIndexKey, attribute?: string): boolean {
        if (attribute) {
            this.assertKnown(attribute);

            return has(this.getCollection(id), attribute);
        }

        if (isObject(id)) {
            return this.attributesWeak.has(id);
        }

        return this.attributes.has(id);
    }

    /**
     * @param {AttributeIndexKey} from
     * @param {AttributeIndexKey} to
     * @returns {boolean}
     * @memberof AttributeIndex
     */
    public clone(from: AttributeIndexKey, to: AttributeIndexKey): boolean {
        const hasPrimitiveKey: boolean = this.attributes.has(from as string);
        const hasObjectKey: boolean = this.attributesWeak.has(from as object);

        if (!hasPrimitiveKey && !hasObjectKey) {
            return undefined;
        }

        const collection: object = cloneDeep(this.getCollection(from));

        isObject(to) ? this.attributesWeak.set(to, collection) : this.attributes.set(to, collection);

        return this.has(to);
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

    /**
     * @private
     * @param {AttributeIndexKey} id
     * @returns {object}
     * @memberof AttributeIndex
     */
    private getCollection(id: AttributeIndexKey): object {
        return isObject(id) ? this.attributesWeak.get(id) : this.attributes.get(id);
    }
}
