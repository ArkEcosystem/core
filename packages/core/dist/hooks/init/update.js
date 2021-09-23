"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const cli_ux_1 = __importDefault(require("cli-ux"));
const update_1 = require("../../helpers/update");
exports.init = async function ({ id, config }) {
    if (id === "update") {
        return;
    }
    if (!update_1.needsRefresh(config)) {
        return;
    }
    const state = await update_1.checkForUpdates(this);
    if (!state.ready) {
        this.warn(`${state.name} update available from ${chalk_1.default.greenBright(state.currentVersion)} to ${chalk_1.default.greenBright(state.updateVersion)}. Review the latest release and run "ark update" once you wish to update.`);
        const branch = {
            next: "develop",
            latest: "master",
        }[state.channel];
        cli_ux_1.default.url(`Click here to read the changelog for ${state.currentVersion}.`, `https://github.com/ARKEcosystem/core/blob/${branch}/CHANGELOG.md`);
    }
};
//# sourceMappingURL=update.js.map