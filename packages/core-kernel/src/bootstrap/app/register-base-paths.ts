import { set } from "@arkecosystem/utils";
import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import { resolve } from "path";

import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { ConfigRepository } from "../../services/config";
import { Bootstrapper } from "../interfaces";

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
     * @private
     * @type {ConfigRepository}
     * @memberof RegisterBasePaths
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository: ConfigRepository;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterBasePaths
     */
    public async bootstrap(): Promise<void> {
        const paths: Array<[string, string]> = Object.entries(envPaths(this.app.token(), { suffix: "core" }));

        for (let [type, path] of paths) {
            const processPath: string | null = process.env[`CORE_PATH_${type.toUpperCase()}`];

            if (processPath) {
                path = processPath;
            }

            if (this.configRepository.has(`app.flags.paths.${type}`)) {
                path = this.configRepository.get(`app.flags.paths.${type}`);
            }

            path = resolve(expandHomeDir(path));

            ensureDirSync(path);

            set(process.env, `CORE_PATH_${type.toUpperCase()}`, path);

            this.app[camelCase(`use_${type}_path`)](path);

            this.app.rebind<string>(`path.${type}`).toConstantValue(path);
        }
    }
}
