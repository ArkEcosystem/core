import { readJSON } from "fs-extra";
import { join } from "path";

import { injectable } from "../ioc";

interface Config {
    token: string;
    network: string;
}

/**
 * @export
 * @class DiscoverNetwork
 */
@injectable()
export class DiscoverConfig {
    /**
     * @param {string} path
     * @returns {Promise<string>}
     * @memberof DiscoverNetwork
     */
    public async discover(): Promise<Config | undefined> {
        try {
            return await readJSON(join(process.env.CORE_PATH_CONFIG!, "config.json"));
        } catch {}

        return undefined;
    }
}
