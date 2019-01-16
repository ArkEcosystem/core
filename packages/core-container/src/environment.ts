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

        const createPathVariables = values => {
            for (const [key, value] of Object.entries(values)) {
                if (allowedKeys.includes(key)) {
                    process.env[`CORE_PATH_${key.toUpperCase()}`] = resolve(expandHomeDir(value));

                    ensureDirSync(process.env[`CORE_PATH_${key.toUpperCase()}`]);
                }
            }
        };

        if (this.variables.token) {
            createPathVariables(envPaths(this.variables.token, { suffix: "core" }));
        } else if (this.variables.data && this.variables.config) {
            createPathVariables(this.variables);
        } else {
            throw new Error("Neither a token nor config and data path were found. Please provide them and try again.");
        }
    }

    /**
     * Export all additional variables for the core environment.
     * @return {void}
     */
    private exportVariables() {
        // Don't pollute the test environment!
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const envPath = expandHomeDir(`${process.env.CORE_PATH_DATA}/.env`);

        if (existsSync(envPath)) {
            const env = require("envfile").parseFileSync(envPath);

            Object.keys(env).forEach(key => {
                process.env[key] = env[key];
            });
        }
    }
}
