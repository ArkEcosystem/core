"use strict";
// Based on https://github.com/oclif/plugin-not-found/blob/master/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Levenshtein = __importStar(require("fast-levenshtein"));
const lodash_minby_1 = __importDefault(require("lodash.minby"));
const prompts_1 = require("../../helpers/prompts");
const closest = (commandIDs, cmd) => {
    return lodash_minby_1.default(commandIDs, c => Levenshtein.get(cmd, c));
};
exports.init = async function (opts) {
    const commandIDs = opts.config.commandIDs;
    if (!commandIDs.length) {
        return;
    }
    let binHelp = `${opts.config.bin} help`;
    const idSplit = opts.id.split(":");
    if (opts.config.findTopic(idSplit[0])) {
        // if valid topic, update binHelp with topic
        binHelp = `${binHelp} ${idSplit[0]}`;
    }
    const suggestion = closest(commandIDs, opts.id);
    this.warn(`${chalk_1.default.redBright(opts.id)} is not a ${opts.config.bin} command.`);
    await prompts_1.confirm(`Did you mean ${chalk_1.default.blueBright(suggestion)}?`, async () => {
        try {
            const argv = process.argv;
            await this.config.runCommand(suggestion, argv.slice(3, argv.length));
        }
        catch (err) {
            this.error(err.message);
        }
    }, this.error(`Run ${chalk_1.default.blueBright(binHelp)} for a list of available commands.`, { exit: 127 }));
};
//# sourceMappingURL=suggest.js.map