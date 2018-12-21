import envfile from "envfile";
import { existsSync } from "fs-extra";
import { resolve } from "path";

export class Preset {
    private environment: object;
    private plugins: object;

    constructor(preset: string) {
        if (!preset) {
            return;
        }

        if (!existsSync(preset)) {
            throw new Error(`No preset found at ${preset}`);
        }

        this.environment = envfile.parseFileSync(`${preset}/env`);
        this.plugins = require(`${preset}/plugins.js`);
    }

    public getEnvironment(): object {
        return this.environment;
    }

    public getPlugins(): object {
        return this.plugins;
    }
}
