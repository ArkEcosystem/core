import envfile from "envfile";
import { existsSync } from "fs-extra";
import { resolve } from "path";

export class Preset {
    private directory: string;
    private environment: object;
    private plugins: object;

    constructor(preset: string) {
        this.directory = resolve(`./src/presets/${preset}`);

        if (!existsSync(this.directory)) {
            throw new Error();
        }

        this.environment = envfile.parseFileSync(`${this.directory}/.env`);
        this.plugins = require(`${this.directory}/plugins.js`);
    }

    public getEnvironment(): object {
        return this.environment;
    }

    public getPlugins(): object {
        return this.plugins;
    }
}
