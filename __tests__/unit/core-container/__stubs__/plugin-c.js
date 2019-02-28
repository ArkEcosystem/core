exports.plugin = {
    pkg: {
        name: "stub/plugin-c",
        version: "1.0.0",
    },
    alias: "stub-plugin-c",
    register(container, options) {
        return {
            container,
            options,
        };
    },
};
