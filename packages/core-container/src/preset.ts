import envfile from "envfile";
import { existsSync } from "fs-extra";

export class Preset {
    private environment: object;
    private plugins: object;

    constructor(preset: string) {
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
