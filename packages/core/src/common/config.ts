import { Utils } from "@arkecosystem/core-kernel";
import { existsSync } from "fs-extra";
import { join } from "path";

import { CommandFlags } from "../types";
// import { abort } from "./cli";
import { getPaths } from "./env";

// todo: review the implementation - throw or return a default?
export const getConfigValue = <T>(flags: CommandFlags, file: string, path: string): T | void => {
    const { config } = getPaths(flags.token, flags.network);

    const js: string = join(config, `${file}.js`);

    if (existsSync(js)) {
        return Utils.get(require(js), path);
    }

    const json: string = join(config, `${file}.json`);

    if (existsSync(json)) {
        return Utils.get(require(json), path);
    }

    return {} as T;
    // return abort(`The ${file} file does not exist.`);
};
