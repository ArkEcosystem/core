import { readJSONSync } from "fs-extra";
import { join } from "path";
import glob from "glob";

import { injectable } from "../ioc";

interface Plugin {
    path: string;
    name: string;
    version: string;
}

/**
 * @export
 * @class DiscoverPlugins
 */
@injectable()
export class DiscoverPlugins {
    /**
     * @returns {Promise<string>}
     * @memberof DiscoverPlugins
     * @param path
     */
    public async discover(path: string): Promise<Plugin[]> {
        const plugins: Plugin[] = [];

        const packagePaths = glob
            .sync("{*/*/package.json,*/package.json}", { cwd: path })
            .map((packagePath) => join(path, packagePath).slice(0, -"/package.json".length));

        for (let packagePath of packagePaths) {
            const packageJson = readJSONSync(join(packagePath, "package.json"));

            plugins.push({
                path: packagePath,
                name: packageJson.name,
                version: packageJson.version,
            });
        }

        return plugins;
    }
}
