import envPaths from "env-paths";
import { existsSync, lstatSync, readdirSync, readJSONSync } from "fs-extra";
import { join } from "path";

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
     * @param token
     * @param network
     */
    public async discover(token: string = "", network: string = ""): Promise<Plugin[]> {
        const plugins: Plugin[] = [];

        const path = join(envPaths(token, { suffix: "core" }).data, network, "plugins");

        await this.discoverPackages(plugins, path);

        console.log(plugins);

        return plugins;
    }

    private async discoverPackages(plugins: Plugin[], path: string): Promise<void> {
        const packageJsonPath = join(path, "package.json");

        if (existsSync(packageJsonPath)) {
            const packageJson = readJSONSync(packageJsonPath);

            plugins.push({
                path,
                name: packageJson.name,
                version: packageJson.version,
            });

            return;
        }

        const dirs = readdirSync(path)
            .map((item: string) => `${path}/${item}`)
            .filter((item: string) => lstatSync(item).isDirectory());

        for (const dir of dirs) {
            await this.discoverPackages(plugins, dir);
        }
    }
}
