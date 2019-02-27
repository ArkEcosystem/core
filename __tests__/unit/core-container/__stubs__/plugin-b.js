exports.plugin = {
    pkg: {
        name: "stub/plugin-b",
        version: "1.0.0",
    },
    alias: "stub-plugin-b",
    register(container, options) {
        return {
            container,
            options,
        };
    },
    deregister() {},
};
