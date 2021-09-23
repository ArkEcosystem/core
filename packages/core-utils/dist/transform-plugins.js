"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPlugins = (plugins) => {
    const result = {};
    for (let [name, options] of Object.entries(plugins)) {
        if (options.server) {
            options = { enabled: options.enabled, ...options.server };
        }
        const port = Number(options.port);
        const enabled = !!options.enabled;
        if (isNaN(port) || name.includes("core-p2p")) {
            continue;
        }
        result[name] = {
            enabled,
            port,
        };
    }
    return result;
};
//# sourceMappingURL=transform-plugins.js.map