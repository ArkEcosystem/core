import { readJSONSync } from "fs-extra";
import glob from "glob";
import { join } from "path";

import { Plugin } from "../contracts/kernel/application";
import { Identifiers, inject, injectable } from "../ioc";

@injectable()
export class PluginDiscoverer {
    @inject(Identifiers.ApplicationToken)
    // @ts-ignore
    private readonly token!: string;

    @inject(Identifiers.ApplicationNetwork)
    // @ts-ignore
    private readonly network!: string;

    public async get(name: string): Promise<Plugin> {
        // Exist in project packages
        const projectPackages = await this.discover("*/package.json", join(__dirname, "../../../../packages"));
        const projectPackage = projectPackages.find((plugin) => plugin.name === name);

        if (projectPackage) {
            return projectPackage;
        }

        // Exist in project plugins
        const projectPlugins = await this.discover("*/package.json", join(__dirname, "../../../../plugins"));
        const projectPlugin = projectPlugins.find((plugin) => plugin.name === name);

        if (projectPlugin) {
            return projectPlugin;
        }

        throw new Error(`Package ${name} couldn't be located.`);
    }

    private async discover(pattern: string, path: string): Promise<Plugin[]> {
        const plugins: Plugin[] = [];

        const packagePaths = glob
            // .sync("{*/*/package.json,*/package.json}", { cwd: path })
            .sync(pattern, { cwd: path })
            .map((packagePath) => join(path, packagePath).slice(0, -"/package.json".length));

        for (const packagePath of packagePaths) {
            const packageJson = readJSONSync(join(packagePath, "package.json"));

            plugins.push({
                packageId: packagePath,
                name: packageJson.name,
                version: packageJson.version,
            });
        }

        return plugins;
    }
}
