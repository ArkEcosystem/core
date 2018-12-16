import { NetworkManager } from "@arkecosystem/crypto";
import expandHomeDir from "expand-home-dir";
import { existsSync } from "fs-extra";
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
        const allowedKeys = ["config", "data"];

        for (const [key, value] of Object.entries(this.variables)) {
            if (allowedKeys.includes(key)) {
                process.env[`ARK_PATH_${key.toUpperCase()}`] = resolve(expandHomeDir(value));
            }
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

        const envPath = expandHomeDir(`${process.env.ARK_PATH_DATA}/.env`);

        if (existsSync(envPath)) {
            const env = require("envfile").parseFileSync(envPath);

            Object.keys(env).forEach(key => {
                process.env[key] = env[key];
            });
        }
    }
}
