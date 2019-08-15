import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync } from "fs-extra";
import { resolve } from "path";
import { Kernel } from "../contracts";

/**
 * @export
 * @class LoadEnvironmentVariables
 */
export class LoadEnvironmentVariables {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        await app.resolve("configLoader").loadEnvironmentVariables();

        for (const [key, value] of Object.entries(envPaths(app.token(), { suffix: "core" }))) {
            const path = resolve(`${expandHomeDir(value)}/${app.network()}`);

            ensureDirSync(path);

            process.env[`PATH_${key.toUpperCase()}`] = path;
        }
    }
}
