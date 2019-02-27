exports.plugin = {
    pkg: {
        name: "stub/plugin-a",
        version: "1.0.0",
    },
    alias: "stub-plugin-a",
    register(container, options) {
        return {
            container,
            options,
        };
    },
    deregister() {},
};
