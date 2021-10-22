import { existsSync, readJSONSync, removeSync } from "fs-extra";
import glob from "glob";
import { join } from "path";

import * as Contracts from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Environment } from "./environment";
import { File, Git, NPM, Source } from "./source-providers";

@injectable()
export class PluginManager implements Contracts.PluginManager {
    @inject(Identifiers.Environment)
    private readonly environment!: Environment;

    public async list(token: string, network: string): Promise<Contracts.Plugin[]> {
        const plugins: Contracts.Plugin[] = [];

        const path = this.getPluginsPath(token, network);

        const packagePaths = glob
            .sync("{@*/*/package.json,*/package.json}", { cwd: path })
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

    public async install(token: string, network: string, pkg: string, version?: string): Promise<void> {
        for (const Instance of [File, Git, NPM]) {
            const source: Source = new Instance({
                data: this.getPluginsPath(token, network),
                temp: this.getTempPath(token, network),
            });

            if (await source.exists(pkg, version)) {
                return source.install(pkg, version);
            }
        }

        throw new Error(`The given package [${pkg}] is neither a git nor a npm package.`);
    }

    public async update(token: string, network: string, pkg: string): Promise<void> {
        const paths = {
            data: this.getPluginsPath(token, network),
            temp: this.getTempPath(token, network),
        };
        const directory: string = join(paths.data, pkg);

        if (!existsSync(directory)) {
            throw new Error(`The package [${pkg}] does not exist.`);
        }

        if (existsSync(`${directory}/.git`)) {
            return new Git(paths).update(pkg);
        }

        return new NPM(paths).update(pkg);
    }

    public async remove(token: string, network: string, pkg): Promise<void> {
        const directory: string = join(this.getPluginsPath(token, network), pkg);

        if (!existsSync(directory)) {
            throw new Error(`The package [${pkg}] does not exist.`);
        }

        removeSync(directory);
    }

    private getPluginsPath(token: string, network: string): string {
        return join(this.environment.getPaths(token, network).data, "plugins");
    }

    private getTempPath(token: string, network: string): string {
        return join(this.environment.getPaths(token, network).temp, "plugins");
    }
}
