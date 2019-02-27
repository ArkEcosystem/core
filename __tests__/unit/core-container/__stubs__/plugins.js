const { resolve } = require("path");

module.exports = {
    [resolve(__dirname, "./plugin-a")]: {
        enabled: true,
    },
    [resolve(__dirname, "./plugin-b")]: {
        enabled: true,
        property: "value",
    },
    [resolve(__dirname, "./plugin-c")]: {
        enabled: true,
    },
};
