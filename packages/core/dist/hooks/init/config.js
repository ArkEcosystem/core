"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../helpers/config");
// tslint:disable-next-line:only-arrow-functions
exports.init = async function ({ config }) {
    config_1.configManager.setup(config);
    if (config.version.includes("next") && config_1.configManager.get("channel") !== "next") {
        config_1.configManager.set("channel", "next");
    }
};
//# sourceMappingURL=config.js.map