import { set } from "dottie";
import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import { resolve } from "path";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../ioc";

/**
 * @export
 * @class RegisterBasePaths
 * @implements {IBootstrapper}
 */
@injectable()
export class RegisterBasePaths implements IBootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof Local
     */
    @inject("app")
    private readonly app: IApplication;

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

            const binding = `path.${type}`;

            if (this.app.ioc.isBound(binding)) {
                this.app.ioc.unbind(binding);
            }

            this.app.ioc.bind<string>(binding).toConstantValue(path);
        }
    }
}
