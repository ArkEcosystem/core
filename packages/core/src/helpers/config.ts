import { existsSync } from "fs";
import { readJsonSync, removeSync, writeJsonSync } from "fs-extra";
import { getRegistryChannel } from "./update";

class ConfigManager {
    private config;
    private file: string;

    public setup(config) {
        this.config = config;
        this.file = `${config.configDir}/config.json`;

        try {
            this.read();
        } catch (error) {
            removeSync(this.file);

            this.ensureDefaults();
        }
    }

    public get(key) {
        return this.read()[key];
    }

    public update(data): void {
        this.write({ ...this.read(), ...data });
    }

    private ensureDefaults(): void {
        if (!existsSync(this.file)) {
            this.write({
                token: this.config.bin,
                channel: getRegistryChannel(this.config),
            });
        }
    }

    private read() {
        return readJsonSync(this.file);
    }

    private write(data): void {
        writeJsonSync(this.file, data);
    }
}

export const configManager = new ConfigManager();
