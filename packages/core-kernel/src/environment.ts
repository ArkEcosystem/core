import envPaths from "env-paths";
import expandHomeDir from "expand-home-dir";
import { ensureDirSync, existsSync } from "fs-extra";
import { resolve } from "path";

export class Environment {
    /**
     * Create a new environment instance.
     * @param  {Object} variables
     * @return {void}
     */
    constructor(readonly variables: any) {}

    /**
     * Set up the environment variables.
     */
    public setUp() {
        this.exportPaths();
        this.exportVariables();
    }

    /**
     * Export all path variables for the core environment.
     * @return {void}
     */
    private exportPaths() {
        const allowedKeys = ["data", "config", "cache", "log", "temp"];

        const createPathVariables = (values, namespace?) =>
            allowedKeys.forEach(key => {
                if (values[key]) {
                    const name = `CORE_PATH_${key.toUpperCase()}`;
                    let path = resolve(expandHomeDir(values[key]));

                    if (namespace) {
                        path += `/${this.variables.network}`;
                    }

                    process.env[name] = path;
                    ensureDirSync(path);
                }
            });

        createPathVariables(envPaths(this.variables.token, { suffix: "core" }), this.variables.network);

        if (this.variables.data || this.variables.config) {
            createPathVariables(this.variables);
        }
    }

    /**
     * Export all additional variables for the core environment.
     * @return {void}
     */
    private exportVariables() {
        process.env.CORE_TOKEN = this.variables.token;

        // Don't pollute the test environment!
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const envPath = expandHomeDir(`${process.env.CORE_PATH_CONFIG}/.env`);

        if (existsSync(envPath)) {
            const env = require("envfile").parseFileSync(envPath);

            Object.keys(env).forEach(key => {
                process.env[key] = env[key];
            });
        }
    }
}
