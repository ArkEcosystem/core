import { readJSONSync } from "fs-extra";
import glob from "glob";
import { join } from "path";

import * as Contracts from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Environment } from "./environment";

@injectable()
export class PluginManager implements Contracts.PluginManager {
    @inject(Identifiers.Environment)
    private readonly environment!: Environment;

    public async list(token: string, network: string): Promise<Contracts.Plugin[]> {
        const plugins: Contracts.Plugin[] = [];

        const path = this.getPluginsPath(token, network);

        const packagePaths = glob
            .sync("{*/*/package.json,*/package.json}", { cwd: path })
            .map((packagePath) => join(path, packagePath).slice(0, -"/package.json".length));

        for (const packagePath of packagePaths) {
            const packageJson = readJSONSync(join(packagePath, "package.json"));

            plugins.push({
                path: packagePath,
                name: packageJson.name,
                version: packageJson.version,
            });
        }

        return plugins;
    }

    private getPluginsPath(token: string, network: string): string {
        return join(this.environment.getPaths(token, network).data, "plugins");
    }
}
