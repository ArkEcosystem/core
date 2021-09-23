"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Resolution modes.
 */
exports.InjectionMode = {
    /**
     * The dependencies will be resolved by injecting the cradle proxy.
     *
     * @type {String}
     */
    PROXY: 'PROXY',
    /**
     * The dependencies will be resolved by inspecting parameter names of the function/constructor.
     *
     * @type {String}
     */
    CLASSIC: 'CLASSIC'
};
//# sourceMappingURL=injection-mode.js.map