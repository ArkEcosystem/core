import { Constructor } from "../../types/container";

export class MixinService {
    /**
     * @private
     * @type {Map<string, Function>}
     * @memberof MixinService
     */
    private readonly mixins: Map<string, Function> = new Map<string, Function>();

    /**
     * @param {string} name
     * @returns {Function}
     * @memberof MixinService
     */
    public get(name: string): Function {
        return this.mixins.get(name);
    }

    /**
     * @param {string} name
     * @param {Function} macro
     * @memberof MixinService
     */
    public set(name: string, macro: Function) {
        this.mixins.set(name, macro);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof MixinService
     */
    public forget(name: string): boolean {
        return this.mixins.delete(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof MixinService
     */
    public has(name: string): boolean {
        return this.mixins.has(name);
    }

    /**
     * @template T
     * @param {(string | string[])} names
     * @param {Constructor<T>} value
     * @returns {Constructor<T>}
     * @memberof MixinService
     */
    public apply<T>(names: string | string[], value: Constructor): Constructor<T> {
        if (!Array.isArray(names)) {
            names = [names];
        }

        let macroValue: Constructor<T> = this.mixins.get(names[0])(value);

        names.shift();

        for (const name of names) {
            macroValue = this.mixins.get(name)(macroValue);
        }

        return macroValue;
    }
}
