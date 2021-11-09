import { existsSync, readJSONSync } from "fs-extra";
import glob from "glob";
import { join } from "path";

import { Application, Plugin } from "../contracts/kernel/application";
import { PluginCannotBeFound } from "../exceptions/plugins";
import { Identifiers, inject, injectable } from "../ioc";

@injectable()
export class PluginDiscoverer {
    @inject(Identifiers.Application)
    private readonly app!: Application;

    private plugins: Plugin[] = [];

    public async initialize(): Promise<void> {
        this.plugins = [];

        const discoverOnPath = async (patter: string, path: string): Promise<void> => {
            if (existsSync(path)) {
                this.plugins = this.plugins.concat(await this.discover(patter, path));
            }
        };

        await discoverOnPath("*/package.json", join(__dirname, "../../../../packages")); // Project packages
        await discoverOnPath("*/package.json", join(__dirname, "../../../../plugins")); // Project plugins
        await discoverOnPath("{*/*/package.json,*/package.json}", this.app.dataPath("plugins")); // Installed plugins
    }

    public get(name: string): Plugin {
        const plugin = this.plugins.find((plugin) => plugin.name === name);

        if (plugin) {
            return plugin;
        }

        try {
            const packageJson = require(`${name}/package.json`);
            return {
                name,
                version: packageJson.version,
                packageId: name,
            };
        } catch {
            throw new PluginCannotBeFound(name);
        }
    }

    private async discover(pattern: string, path: string): Promise<Plugin[]> {
        const plugins: Plugin[] = [];

        const packagePaths = glob
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
