import envPaths, { Paths } from "env-paths";
import { parseFileSync, stringifySync } from "envfile";
import { existsSync, writeFileSync } from "fs-extra";
import { resolve } from "path";

import { injectable } from "../ioc";

/**
 * @export
 * @class Environment
 */
@injectable()
export class Environment {
    /**
     * @param {string} token
     * @param {string} network
     * @returns {Paths}
     * @memberof Environment
     */
    public getPaths(token: string, network: string): Paths {
        let paths: Paths = envPaths(token, { suffix: "core" });

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${network}`;
        }

        if (process.env.CORE_PATH_CONFIG) {
            paths = {
                ...paths,
                ...{ config: resolve(process.env.CORE_PATH_CONFIG) },
            };
        }

        if (process.env.CORE_PATH_DATA) {
            paths = {
                ...paths,
                ...{ data: resolve(process.env.CORE_PATH_DATA) },
            };
        }

        return paths;
    }

    /**
     * @param {string} envFile
     * @param {(Record<string, string | number>)} variables
     * @memberof Environment
     */
    public updateVariables(envFile: string, variables: Record<string, string | number>): void {
        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}.`);
        }

        const env: object = parseFileSync(envFile);

        for (const [key, value] of Object.entries(variables)) {
            env[key] = value;
        }

        writeFileSync(envFile, stringifySync(env).trim());
    }
}
