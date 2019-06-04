import { ensureFileSync, readJsonSync, removeSync, writeJsonSync } from "fs-extra";
import { getRegistryChannel } from "./update";

class ConfigManager {
    private config;
    private file: string;

    public setup(config) {
        this.config = config;
        this.file = `${config.configDir}/config.json`;

        this.ensureDefaults();
    }

    public get(key) {
        return this.read()[key];
    }

    public update(data): void {
        this.write({ ...this.read(), ...data });
    }

    private ensureDefaults(): void {
        if (!this.read()) {
            removeSync(this.file);

            ensureFileSync(this.file);

            this.write({
                token: this.config.bin,
                channel: getRegistryChannel(this.config),
                updateMethod: "npm",
            });
        }
    }

    private read(): any {
        try {
            return readJsonSync(this.file);
        } catch (error) {
            return false;
        }
    }

    private write(data): void {
        writeJsonSync(this.file, data);
    }
}

export const configManager = new ConfigManager();
