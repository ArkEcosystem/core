import { set } from "dottie";
import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import { resolve } from "path";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject, Identifiers } from "../../container";

/**
 * @export
 * @class RegisterBasePaths
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterBasePaths implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

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

            if (this.app.isBound(binding)) {
                this.app.unbind(binding);
            }

            this.app.bind<string>(binding).toConstantValue(path);
        }
    }
}
