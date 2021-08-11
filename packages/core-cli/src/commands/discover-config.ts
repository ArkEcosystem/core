import envPaths from "env-paths";
import { readJSON } from "fs-extra";
import { join } from "path";

import { injectable } from "../ioc";

interface Config {
    token: string;
    network: string;
}

/**
 * @export
 * @class DiscoverConfig
 */
@injectable()
export class DiscoverConfig {
    /**
     * @returns {Promise<string>}
     * @memberof DiscoverConfig
     * @param token
     * @param network
     */
    public async discover(token: string = "", network: string = ""): Promise<Config | undefined> {
        try {
            return await readJSON(join(process.env.CORE_PATH_CONFIG!, "config.json"));
        } catch {}

        try {
            return await readJSON(join(envPaths(token, { suffix: "core" }).config, network, "config.json"));
        } catch {}

        return undefined;
    }
}
