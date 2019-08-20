import { set } from "dottie";
import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import { resolve } from "path";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBasePaths
 */
export class RegisterBasePaths extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterBasePaths
     */
    public async bootstrap(): Promise<void> {
        const paths: Array<[string, string]> = Object.entries(envPaths(this.app.token(), { suffix: "core" }));

        for (let [type, path] of paths) {
            const processPath: string | null = process.env[`CORE_PATH_${type.toUpperCase()}`];

            if (processPath) {
                path = resolve(expandHomeDir(processPath));
            }

            ensureDirSync(path);

            set(process.env, `CORE_PATH_${type.toUpperCase()}`, path);

            this.app[camelCase(`use_${type}_path`)](path);

            this.app.bind(`path.${type}`, path);
        }
    }
}
