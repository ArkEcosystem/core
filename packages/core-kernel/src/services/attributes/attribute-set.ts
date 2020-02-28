import { strictEqual } from "assert";

import { injectable } from "../../ioc";

@injectable()
export class AttributeSet {
    /**
     * @private
     * @type {Set<string>}
     * @memberof AttributeSet
     */
    private readonly attributes: Set<string> = new Set<string>();

    /**
     * @returns {string[]}
     * @memberof AttributeSet
     */
    public all(): string[] {
        return [...this.attributes];
    }

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeSet
     */
    public set(attribute: string): boolean {
        strictEqual(this.attributes.has(attribute), false, `Duplicated attribute: ${attribute}`);

        this.attributes.add(attribute);

        return this.has(attribute);
    }

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeSet
     */
    public forget(attribute: string): boolean {
        strictEqual(this.attributes.has(attribute), true, `Unknown attribute: ${attribute}`);

        this.attributes.delete(attribute);

        return !this.has(attribute);
    }

    /**
     * @returns {boolean}
     * @memberof AttributeSet
     */
    public flush(): boolean {
        this.attributes.clear();

        return this.attributes.size === 0;
    }

    /**
     * @param {string} attribute
     * @returns {boolean}
     * @memberof AttributeSet
     */
    public has(attribute: string): boolean {
        return this.attributes.has(attribute);
    }
}
