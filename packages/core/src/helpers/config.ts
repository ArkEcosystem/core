import { readFileSync, writeFileSync } from "fs";
import { getUpdateChannel } from "./update";

class ConfigManager {
    private config;
    private file: string;

    public setup(config) {
        this.config = config;
        this.file = `${config.configDir}/config.json`;

        this.ensureDefaults();
    }

    public update(data) {
        this.write({ ...JSON.parse(readFileSync(this.file).toString()), ...data });
    }

    private ensureDefaults() {
        this.write({
            token: this.config.bin,
            channel: getUpdateChannel(this.config),
        });
    }

    private write(data) {
        writeFileSync(this.file, JSON.stringify(data, null, 4));
    }
}

export const configManager = new ConfigManager();
